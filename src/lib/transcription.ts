import { ISequence, IWord } from "../types/video";

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
  number_of_distinct_channels: number;
  billing_time: number;
  transcription_time: number;
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

const timeToFrames = (time: number, fps: number = 60): number => Math.round(time * fps);

export function createLightTranscription(sequences: ISequence[]): LightTranscription[] {
  return sequences.map((sequence, index) => ({
    id: index,
    text: sequence.text,
  }));
}

export function splitIntoSequences(utterances: Utterance[], sentenceIndex: number): ISequence[] {
  const allWords = utterances.reduce((acc, utterance) => {
    return [...acc, ...utterance.words];
  }, [] as IWord[]);

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
  
  // Initialiser les métadonnées combinées
  const combinedMetadata: TranscriptionMetadata = {
    audio_duration: 0,
    number_of_distinct_channels: 1,
    billing_time: 0,
    transcription_time: 0
  };

  for (let i = 0; i < sentences.length; i++) {
    // Ajouter les métadonnées de la transcription courante
    const currentMetadata = sentences[i].transcription.metadata;
    combinedMetadata.audio_duration += currentMetadata.audio_duration;
    combinedMetadata.billing_time += currentMetadata.billing_time;
    combinedMetadata.transcription_time += currentMetadata.transcription_time;

    // Ajuster les timings des utterances avec l'offset actuel
    const adjustedUtterances = sentences[i].transcription.transcription.utterances.map((utterance: Utterance) => ({
      ...utterance,
      start: utterance.start + timeOffset,
      end: utterance.end + timeOffset,
      words: utterance.words.map(word => ({
        ...word,
        start: word.start + timeOffset,
        end: word.end + timeOffset
      }))
    }));

    // Créer les séquences pour cette phrase
    const s: ISequence[] = splitIntoSequences(adjustedUtterances, sentences[i].index);
    finalSequences.push(...s);

    // Mettre à jour l'offset pour la prochaine phrase
    const lastUtterance = adjustedUtterances[adjustedUtterances.length - 1];
    timeOffset += lastUtterance ? lastUtterance.end - lastUtterance.start : 0;
  }

  return {
    sequences: adjustSequenceTimings(finalSequences, combinedMetadata.audio_duration),
    videoMetadata: combinedMetadata
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

function adjustSequenceTimings(sequences: ISequence[], audioDuration: number): ISequence[] {
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
    } else {
      // Si c'est la dernière séquence, utiliser la durée totale de l'audio
      lastWord.end = audioDuration;
      sequence.end = audioDuration;
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