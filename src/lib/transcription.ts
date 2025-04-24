import { logger } from "@trigger.dev/sdk/v3";
import { ISequence, IWord } from "../types/video";
import axios from "axios";
import FormData from "form-data";
import { createSieveTranscription, pollSieveTranscriptionStatus } from "./sieve";

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
    videoMetadata: metadata
  };
}

function createSequence(words: IWord[], sentenceIndex: number): ISequence {
  const sequenceWords = words.map(word => ({
    ...word,
    word: word.word.trimStart()
  }));

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

    // Ajuster les timings des mots dans la séquence
    for (let i = 0; i < words.length - 1; i++) {
      words[i].end = words[i + 1].start;
      words[i].durationInFrames = timeToFrames(words[i].end - words[i].start);
      durationTotal += words[i].durationInFrames ?? 0;
    }

    // Ajuster le dernier mot de la séquence
    const lastWord = words[words.length - 1];
    if (index < allSequences.length - 1) {
      // Si ce n'est pas la dernière séquence, utiliser le début de la prochaine
      const nextSequenceStart = allSequences[index + 1].start;
      lastWord.end = nextSequenceStart;
      sequence.end = nextSequenceStart;
    }
    
    lastWord.durationInFrames = timeToFrames(lastWord.end - lastWord.start);
    durationTotal += lastWord.durationInFrames;

    return {
      ...sequence,
      words,
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

  // Vérifie si le dernier mot se termine après la durée totale avec une marge de tolérance de 0.1s
  if (words[words.length - 1].end > duration + 0.1) {
    throw new InvalidTimingsError(`Invalid timing: last word ends after audio duration (${words[words.length - 1].end}s > ${duration}s)`);
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
    const MAX_GROQ_ATTEMPTS = 3;
    let attempts = 0;

    // Première tentative avec Groq
    while (attempts < MAX_GROQ_ATTEMPTS) {
        try {
            const formData = new FormData();
            formData.append('url', audioUrl);
            formData.append('model', 'whisper-large-v3');
            
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

            return {
                text: response.data.text,
                raw: response.data
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
            const sieveResult = result.result;
            const words = [];
            let fullText = "";

            // Parcourir tous les segments pour extraire les mots
            for (const segment of sieveResult.segments) {
                fullText += segment.text + " ";
                // Appliquer la fusion des mots avec apostrophe pour chaque segment
                const mergedWords = mergeApostropheWords(segment.words);
                words.push(...mergedWords);
            }

            return {
                text: fullText.trim(),
                raw: {
                    task: "transcribe",
                    text: fullText.trim(),
                    duration: words.length > 0 ? words[words.length - 1].end : 0,
                    language: sieveResult.language_code,
                    segments: null,
                    words: words
                }
            };
        }
    } catch (error: any) {
        logger.error("Erreur de transcription Sieve:", error.message);
    }

    return null;
}