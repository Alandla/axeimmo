import { ISequence, IWord } from "../types/video";

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  durationInFrames?: number;
}

interface Utterance {
  text: string;
  words: IWord[];
  start: number;
  end: number;
  // ... autres propriétés possibles
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

export function splitIntoSequences(utterances: Utterance[], audioDuration: number): ISequence[] {
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
      sequences.push(createSequence(currentSequence));
      currentSequence = [];
    }
  }

  if (currentSequence.length > 0) {
    sequences.push(createSequence(currentSequence));
  }

  return adjustSequenceTimings(mergeShortSequences(sequences), audioDuration);
}

function createSequence(words: IWord[]): ISequence {
  const sequenceWords = words.map(word => ({
    ...word,
    word: word.word.trimStart()
  }));

  return {
    text: sequenceWords.map(w => w.word).join(' '),
    words: sequenceWords,
    start: sequenceWords[0].start,
    end: sequenceWords[sequenceWords.length - 1].end
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
          end: current.end
        };
        continue;
      }
    }
    
    result.push(current);
  }

  return result;
}
