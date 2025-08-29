import { logger } from "@trigger.dev/sdk/v3";
import { ISequence, IWord } from "../types/video";
import axios from "axios";
import FormData from "form-data";
import { createSieveTranscription, pollSieveTranscriptionStatus } from "./sieve";
import { calculateWhisperGroqCost, calculateWhisperSieveCost } from "./cost";

interface Utterance {
  text: string;
  words: IWord[];
  start: number;
  end: number;
  audioIndex: number;
  // ... autres propriétés possibles
}

interface TranscriptionMetadata {
  audio_duration: number;
  language: string;
}

interface SplitSentencesResult {
  sequences: ISequence[];
  rawSequences: ISequence[];
  videoMetadata: TranscriptionMetadata;
}

export interface ISentence {
  text?: string;
  index: number;
  audioUrl: string;
  transcription?: any;
}

export interface LightTranscription {
  id: number;
  text: string;
}

export const timeToFrames = (time: number, fps: number = 60): number => Math.round(time * fps);

export function createLightTranscription(sequences: ISequence[]): LightTranscription[] {
  return sequences.map((sequence, index) => ({
    id: index,
    text: sequence.text,
  }));
}

/**
 * Crée l'objet d'entrée pour l'analyse des zooms à partir des séquences brutes
 * @param rawSeqs Séquences brutes avant ajustement des timings
 * @returns Objet formaté pour VideoZoomInsertionInput
 */
export function createZoomInputFromRawSequences(rawSeqs: ISequence[]) {
  return rawSeqs.map((seq, index) => ({
    id: index,
    words: seq.words.map((word, wordIndex) => {
      // Calculer le silence après ce mot
      let silence = 0;
      if (wordIndex < seq.words.length - 1) {
        // Il y a un mot suivant dans la même séquence
        silence = seq.words[wordIndex + 1].start - word.end;
      } else if (index < rawSeqs.length - 1) {
        // C'est le dernier mot de la séquence, regarder le premier mot de la séquence suivante
        const nextSeq = rawSeqs[index + 1];
        if (nextSeq.words.length > 0) {
          silence = nextSeq.words[0].start - word.end;
        }
      }
      
      return {
        text: word.word,
        start: word.start,
        end: word.end,
        silence: Math.max(0, silence) // Assurer que le silence n'est pas négatif
      };
    })
  }));
}

export function splitIntoSequences(utterances: Utterance, sentenceIndex: number): ISequence[] {
  const allWords = utterances.words;

  const sequences: ISequence[] = [];
  let currentSequence: IWord[] = [];

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];
    currentSequence.push(word);
    
    const isEndOfSentence = word.word.match(/[.!?]$/);
    const duration = word.end - currentSequence[0].start;
    const isLongEnough = duration >= 3;

    if ((isEndOfSentence && duration >= 1) || isLongEnough) {
      sequences.push(createSequence(currentSequence, sentenceIndex));
      currentSequence = [];
    }
  }

  if (currentSequence.length > 0) {
    sequences.push(createSequence(currentSequence, sentenceIndex));
  }

  return mergeShortSequences(sequences);
}

export function splitSentences(sentences: ISentence[]): SplitSentencesResult {
  const finalSequences: ISequence[] = [];
  let timeOffset = 0;

  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].transcription.words.length > 0) {

      // Ajuster les timings des utterances avec l'offset actuel
      const adjusted = {
        ...sentences[i].transcription,
        start: sentences[i].transcription.start + timeOffset,
        end: sentences[i].transcription.end + timeOffset,
        words: sentences[i].transcription.words.map((word: any) => ({
          ...word,
          start: word.start + timeOffset,
          end: word.end + timeOffset
        }))
      }

      // Créer les séquences pour cette phrase
      const s: ISequence[] = splitIntoSequences(adjusted, sentences[i].index);

      finalSequences.push(...s);

      timeOffset = adjusted.end;
    }

  }

  const sequences = adjustSequenceTimings(finalSequences);

  const metadata: TranscriptionMetadata = {
    audio_duration: 0,
    language: sentences[0].transcription.language_code
  };

  if (sequences.length > 0) {
    const lastSequence = sequences[sequences.length - 1];
    metadata.audio_duration = lastSequence.end;
  }

  return {
    sequences: sequences,
    rawSequences: finalSequences,
    videoMetadata: metadata
  };
}

function createSequence(words: IWord[], sentenceIndex: number): ISequence {
  const sequenceWords = words.map(word => ({
    ...word,
    word: word.word.trimStart()
  }));

  // Log warning if sequence contains words with suspicious timing
  const suspiciousWords = sequenceWords.filter(word => {
    const duration = word.end - word.start;
    return duration < 0.1 && duration > 0;
  });

  if (suspiciousWords.length > 0) {
    logger.log(`[TIMING_WARNING] Sequence ${sentenceIndex} contains ${suspiciousWords.length} words with suspicious timing`, {
      sentenceIndex,
      suspiciousWords: suspiciousWords.map(w => ({
        word: w.word,
        duration: w.end - w.start,
        start: w.start,
        end: w.end
      })),
      totalWords: sequenceWords.length
    });
  }

  return {
    text: sequenceWords.map(w => w.word).join(' '),
    words: sequenceWords,
    start: sequenceWords[0].start,
    end: sequenceWords[sequenceWords.length - 1].end,
    audioIndex: sentenceIndex
  };
}

export function adjustSequenceTimings(sequences: ISequence[]): ISequence[] {
  return sequences.map((sequence, index, allSequences) => {
    let durationTotal = 0;
    const words = [...sequence.words];

    // Detect and filter out words with suspicious timing (likely transcription errors)
    const filteredWords = words.filter((word, wordIndex) => {
      const duration = word.end - word.start;
      
      // If word duration is less than 0.1 seconds, it's likely a transcription error
      if (duration < 0.1) {
        logger.log(`[TIMING_FIX] Removing word with suspicious timing: "${word.word}" (${duration}s)`, {
          sequenceIndex: index,
          wordIndex,
          duration,
          start: word.start,
          end: word.end
        });
        return false;
      }
      
      return true;
    });

    // If all words were filtered, keep original to avoid empty sequences
    const wordsToUse = filteredWords.length === 0 ? words : filteredWords;
    
    if (filteredWords.length < words.length) {
      logger.log(`[TIMING_FIX] Filtered ${words.length - filteredWords.length} words with suspicious timing from sequence ${index}`);
    }

    // Ajuster les timings des mots dans la séquence
    for (let i = 0; i < wordsToUse.length - 1; i++) {
      wordsToUse[i].end = wordsToUse[i + 1].start;
      const duration = wordsToUse[i].end - wordsToUse[i].start;
      wordsToUse[i].durationInFrames = timeToFrames(duration);
      durationTotal += wordsToUse[i].durationInFrames ?? 0;
    }

    // Ajuster le dernier mot de la séquence
    if (wordsToUse.length > 0) {
      const lastWord = wordsToUse[wordsToUse.length - 1];
      if (index < allSequences.length - 1) {
        // Si ce n'est pas la dernière séquence, utiliser le début de la prochaine
        const nextSequenceStart = allSequences[index + 1].start;
        lastWord.end = nextSequenceStart;
        sequence.end = nextSequenceStart;
      }
      
      const lastWordDuration = lastWord.end - lastWord.start;
      lastWord.durationInFrames = timeToFrames(lastWordDuration);
      durationTotal += lastWord.durationInFrames;
    }

    return {
      ...sequence,
      words: wordsToUse,
      durationInFrames: durationTotal
    };
  });
}

function mergeShortSequences(sequences: ISequence[]): ISequence[] {
  const result: ISequence[] = [];
  
  for (let i = 0; i < sequences.length; i++) {
    const current = sequences[i];
    const duration = current.end - current.start;

    if (duration < 1 && result.length > 0) {
      const previous = result[result.length - 1];
      const totalDuration = current.end - previous.start;
      
      if (totalDuration < 4) {
        result[result.length - 1] = {
          text: previous.text + current.text,
          words: [...previous.words, ...current.words],
          start: previous.start,
          end: current.end,
          audioIndex: previous.audioIndex
        };
        continue;
      }
    }
    
    result.push(current);
  }

  return result;
}

/**
 * Fusionne les mots avec apostrophe avec le mot précédent
 */
const mergeApostropheWords = (words: Array<{ word: string; start: number; end: number; confidence?: number }>) => {
    const mergedWords = [];
    
    for (let i = 0; i < words.length; i++) {
        const currentWord = words[i];
        
        // Si le mot commence par une apostrophe et ce n'est pas le premier mot
        if (currentWord.word.startsWith("'") && i > 0) {
            const previousWord = mergedWords[mergedWords.length - 1];
            // Fusionner avec le mot précédent
            previousWord.word = previousWord.word + currentWord.word;
            previousWord.end = currentWord.end;
        } else {
            mergedWords.push({ ...currentWord });
        }
    }
    
    return mergedWords;
};

class InvalidTimingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTimingsError';
  }
}

/**
 * Vérifie si les timings de la transcription sont valides
 */
function validateTranscriptionTimings(transcription: any): boolean {
  const duration = transcription.duration;
  const words = transcription.words;

  if (!words || words.length === 0) return true;

  // Vérifie si le premier mot commence après la durée totale
  if (words[0].start > duration) {
    logger.log('Invalid timing: first word starts after audio duration', { transcription })
    throw new InvalidTimingsError(`Invalid timing: first word starts after audio duration (${words[0].start}s > ${duration}s)`);
  }

  // Vérifie si le premier mot commence après 1 seconde
  if (words[0].start > 1) {
    logger.log('Invalid timing: first word starts after 1 second', { transcription })
    throw new InvalidTimingsError(`Invalid timing: first word starts too late (${words[0].start}s > 1s)`);
  }

  return true;
}

/**
 * Récupère la transcription d'un fichier audio à partir d'une URL
 */
export const getTranscription = async (audioUrl: string, text?: string) => {
    const MAX_GROQ_ATTEMPTS = 4;
    let attempts = 0;
    let cost = 0;

    while (attempts < MAX_GROQ_ATTEMPTS) {
        try {
            const formData = new FormData();
            formData.append('url', audioUrl);
            const isTurbo = attempts >= 2;
            formData.append('model', isTurbo ? 'whisper-large-v3-turbo' : 'whisper-large-v3');
            
            if (text) {
                formData.append('prompt', text);
            }
            
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities[]', 'word');
            
            const response = await axios.post(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        ...formData.getHeaders()
                    }
                }
            );

            validateTranscriptionTimings(response.data);
            
            // Calculer le coût en fonction du modèle utilisé
            cost = calculateWhisperGroqCost(response.data.duration, isTurbo);

            return {
                text: response.data.text,
                raw: response.data,
                cost
            };
        } catch (error: any) {
            attempts++;
            if (error instanceof InvalidTimingsError) {
                logger.error(`Erreur de timing Groq (tentative ${attempts}/${MAX_GROQ_ATTEMPTS}):`, { error: error.message });
            } else {
                logger.error(`Erreur de transcription Groq (tentative ${attempts}/${MAX_GROQ_ATTEMPTS}):`, { error: error.response });
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde entre les tentatives

            if (attempts >= MAX_GROQ_ATTEMPTS) {
                logger.warn("Échec des tentatives Groq, basculement vers Sieve");
                break;
            }
        }
    }

    // Fallback vers Sieve si Groq a échoué
    try {
        const jobId = await createSieveTranscription(audioUrl, text);
        const result = await pollSieveTranscriptionStatus(jobId);

        if (result.status === 'done') {
            let duration = 0;
            const sieveResult = result.result;
            const words = [];
            let fullText = "";

            // Parcourir tous les segments pour extraire les mots
            for (const segment of sieveResult.segments) {
                fullText += segment.text + " ";
                // Appliquer la fusion des mots avec apostrophe pour chaque segment
                const mergedWords = mergeApostropheWords(segment.words);
                words.push(...mergedWords);
                duration += segment.end - segment.start;
            }

            cost = calculateWhisperSieveCost(duration);

            return {
                text: fullText.trim(),
                raw: {
                    task: "transcribe",
                    text: fullText.trim(),
                    duration: duration,
                    language: sieveResult.language_code,
                    segments: null,
                    words: words
                },
                cost
            };
        }
    } catch (error: any) {
        logger.error("Erreur de transcription Sieve:", error.message);
    }

    return null;
}