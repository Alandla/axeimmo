import { logger } from "@trigger.dev/sdk/v3";
import { ISequence, IWord } from "../types/video";
import axios from "axios";
import FormData from "form-data";
import Groq from "groq-sdk";
import { wait } from "@trigger.dev/sdk/v3";
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

      logger.info('Adjusted utterances', { adjusted });

      // Créer les séquences pour cette phrase
      const s: ISequence[] = splitIntoSequences(adjusted, sentences[i].index);

      logger.info('Sequences', { s });
      finalSequences.push(...s);

      timeOffset = adjusted.end;

      logger.info('Time offset', { timeOffset });
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

export function combineTranscriptions(sentences: any[]): any {
  let combinedTranscription = {
      metadata: {
          audio_duration: 0,
          number_of_distinct_channels: 1,
          billing_time: 0,
          transcription_time: 0
      },
      transcription: {
          languages: ["fr"],
          utterances: [] as any[],
          full_transcript: ""
      }
  };

  let timeOffset = 0;
  let fullTranscript: any[] = [];

  sentences.forEach(sentence => {
      const trans = sentence.transcription;
      
      // Mettre à jour les métadonnées
      combinedTranscription.metadata.audio_duration += trans.metadata.audio_duration;
      combinedTranscription.metadata.billing_time += trans.metadata.billing_time;
      combinedTranscription.metadata.transcription_time += trans.metadata.transcription_time;

      // Ajuster les timings pour chaque utterance
      trans.transcription.utterances.forEach((utterance: any) => {
          const adjustedUtterance = {
              ...utterance,
              start: utterance.start + timeOffset,
              end: utterance.end + timeOffset,
              audioIndex: sentence.index,
              words: utterance.words.map((word: any) => ({
                  ...word,
                  start: word.start + timeOffset,
                  end: word.end + timeOffset
              }))
          };
          combinedTranscription.transcription.utterances.push(adjustedUtterance);
      });

      fullTranscript.push(trans.transcription.full_transcript);
      const lastUtterance = trans.transcription.utterances[trans.transcription.utterances.length - 1];
      timeOffset += lastUtterance ? lastUtterance.end : 0;
  });

  combinedTranscription.transcription.full_transcript = fullTranscript.join(" ");

  return combinedTranscription;
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

/**
 * Récupère la transcription d'un fichier audio à partir d'une URL
 * @param audioUrl URL du fichier audio à transcrire
 * @param text Texte optionnel pour guider la transcription
 * @returns La transcription du fichier audio
 */
export const getTranscription = async (audioUrl: string, text?: string) => {
  const useGroq = false;
  if (useGroq) {
      let attempts = 0;
      const maxAttempts = 6;
      while (attempts < maxAttempts) {
          try {
              const formData = new FormData();
              formData.append('url', audioUrl);
              formData.append('model', 'whisper-large-v3-turbo');
              
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

              return {
                  text: response.data.text,
                  raw: response.data
              };
          } catch (error: any) {
              attempts++;
              logger.error(`Erreur de transcription Groq (tentative ${attempts}):`, { error: error.response });
              if (attempts >= maxAttempts) {
                  console.error("Erreur de transcription Groq:", error.response?.data || error.message);
                  return null;
              }
          }
      }
  } else {
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
          return null;
      } catch (error: any) {
          logger.error("Erreur de transcription Sieve:", error.message);
          return null;
      }
  }

  return null;
}

/**
 * Transcrit toutes les sentences en parallèle et ajoute les résultats aux sentences
 * @param sentences Liste des sentences à transcrire
 * @returns Les sentences avec les résultats de transcription
 */
export const transcribeAllSentences = async (sentences: ISentence[]) => {
    try {
        const transcriptionPromises = sentences.map(sentence => 
            getTranscription(sentence.audioUrl, sentence.text)
        );

        const transcriptionResults = await Promise.all(transcriptionPromises);

        return sentences.map((sentence, index) => {
            const transcriptionResult = transcriptionResults[index];
            
            if (!transcriptionResult) {
                return sentence;
            }

            const words = transcriptionResult.raw.words
            
            return {
                ...sentence,
                transcription: {
                  text: transcriptionResult.text,
                  language: transcriptionResult.raw.language,
                  start: words.length > 0 ? words[0].start : 0,
                  end: words.length > 0 ? words[words.length - 1].end : 0,
                  words: words
                }
            };
        });
    } catch (error: any) {
        console.error("Erreur lors de la transcription des sentences:", error);
        return sentences; // En cas d'erreur, on retourne les sentences inchangées
    }
}