import { ISentence } from "./transcription";
import { ISequence, IWord } from "../types/video";
import { removeEmojis } from "./utils";
import { splitScriptIntoSentences } from "../utils/text";

export interface Veo3TranscriptionResult {
  audioIndex: number;
  audioUrl: string;
  videoUrl: string;
  transcription: {
    text: string;
    language: string;
    start: number;
    end: number;
    words: IWord[];
  };
}

export interface Veo3AvatarRender {
  audioIndex: number;
  url: string;
  durationInSeconds: number;
  startInFrames: number;
}

export interface Veo3Voice {
  index: number;
  url: string;
  voiceId?: string;
  start: number;
  end: number;
  durationInFrames: number;
}

interface Veo3SentenceCreationOptions {
  script: string;
  maxSentenceLength?: number;
  sentenceDuration?: number;
  fps?: number;
}

interface Veo3SequenceCreationOptions {
  sentences: ISentence[];
  maxSequenceLength?: number;
  minSequenceLength?: number;
  sequenceDuration?: number;
  fps?: number;
}

/**
 * Create sentences with fake transcriptions for Veo 3
 * Split script into sentences and combine short ones (~8 seconds, max 150 chars)
 */
export function createVeo3Sentences(options: Veo3SentenceCreationOptions): ISentence[] {
  const {
    script,
    maxSentenceLength = 150,
    sentenceDuration = 8,
    fps = 60
  } = options;

  const processedScript = removeEmojis(script);
  const scriptSentences = splitScriptIntoSentences(processedScript);

  // Combine short sentences into ~8 second sentences (max 150 chars)
  const combinedSentences: string[] = [];
  let currentSentence = '';

  for (let i = 0; i < scriptSentences.length; i++) {
    const sentence = scriptSentences[i];
    const combinedText = currentSentence ? `${currentSentence} ${sentence}` : sentence;

    if (combinedText.length <= maxSentenceLength) {
      currentSentence = combinedText;
      
      // If this is the last sentence, add it
      if (i === scriptSentences.length - 1) {
        combinedSentences.push(currentSentence);
      }
    } else {
      // Would exceed limit
      if (currentSentence) {
        combinedSentences.push(currentSentence);
        currentSentence = sentence;
      } else {
        // Single sentence is too long, add it anyway
        combinedSentences.push(sentence);
      }
      
      // If this is the last sentence, add it
      if (i === scriptSentences.length - 1) {
        combinedSentences.push(currentSentence);
      }
    }
  }

  // Create sentences with fake transcriptions
  return combinedSentences.map((sentenceText, sentenceIndex) => {
    const words = sentenceText.split(/\s+/).filter((w: string) => w.length > 0);
    const wordCount = words.length;
    const wordDuration = sentenceDuration / wordCount;
    
    const sentenceStart = sentenceIndex * sentenceDuration;
    const sentenceEnd = sentenceStart + sentenceDuration;

    // Create word timings
    const wordTimings = words.map((word, wordIndex) => {
      const wordStart = sentenceStart + wordIndex * wordDuration;
      const wordEnd = wordStart + wordDuration;

      return {
        word: word,
        start: wordStart,
        end: wordEnd
      };
    });

    return {
      index: sentenceIndex,
      text: sentenceText,
      audioUrl: '', // No audio for Veo3
      transcription: {
        text: sentenceText,
        language: 'English',
        start: sentenceStart,
        end: sentenceEnd,
        words: wordTimings
      }
    };
  });
}

/**
 * Create sequences from sentences with fake transcriptions for Veo 3
 * Step 1: Split sentences into sequences (~3 seconds, max 65 chars)
 * Step 2: Merge sequences that are too short (<20 chars) with previous one
 */
export function createVeo3SequencesFromSentences(options: Veo3SequenceCreationOptions): ISequence[] {
  const {
    sentences,
    maxSequenceLength = 65,
    minSequenceLength = 20,
    sequenceDuration = 3,
    fps = 60
  } = options;

  const sequences: ISequence[] = [];
  let globalTime = 0;

  sentences.forEach((sentence) => {
    if (!sentence.transcription) {
      return;
    }

    const sentenceText = sentence.transcription.text;
    const sentenceIndex = sentence.index;
    const words = sentenceText.split(/\s+/).filter((w: string) => w.length > 0);
    const sentenceSequences: ISequence[] = [];
    let currentSequenceText = '';

    // Step 1: Create sequences from sentence (~3 seconds, max 65 chars)
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testText = currentSequenceText ? `${currentSequenceText} ${word}` : word;
      
      // Check if word ends with sentence terminator
      const endsWithPunctuation = /[.!?]$/.test(word);

      if (testText.length <= maxSequenceLength && !endsWithPunctuation) {
        currentSequenceText = testText;
        
        // If last word, create the sequence
        if (i === words.length - 1) {
          sentenceSequences.push({
            text: currentSequenceText,
            words: [],
            start: 0, // Will be calculated later
            end: 0,   // Will be calculated later
            audioIndex: sentenceIndex
          });
        }
      } else if (endsWithPunctuation) {
        // End of phrase detected, create sequence immediately
        currentSequenceText = testText;
        sentenceSequences.push({
          text: currentSequenceText,
          words: [],
          start: 0,
          end: 0,
          audioIndex: sentenceIndex
        });
        
        // Reset for next sequence
        currentSequenceText = '';
      } else {
        // Would exceed limit, save current sequence
        if (currentSequenceText) {
          sentenceSequences.push({
            text: currentSequenceText,
            words: [],
            start: 0,
            end: 0,
            audioIndex: sentenceIndex
          });
        }
        
        // Start new sequence with current word
        currentSequenceText = word;
        
        // If last word, create the sequence
        if (i === words.length - 1) {
          sentenceSequences.push({
            text: currentSequenceText,
            words: [],
            start: 0,
            end: 0,
            audioIndex: sentenceIndex
          });
        }
      }
    }

    // Step 2: Merge sequences that are too short with previous one
    const mergedSequences: ISequence[] = [];
    for (let i = 0; i < sentenceSequences.length; i++) {
      const seq = sentenceSequences[i];
      
      if (seq.text.length < minSequenceLength && mergedSequences.length > 0) {
        // Merge with previous sequence
        const prevSeq = mergedSequences[mergedSequences.length - 1];
        prevSeq.text = `${prevSeq.text} ${seq.text}`;
      } else {
        mergedSequences.push(seq);
      }
    }

    // Calculate timings for sequences based on sentence transcription
    mergedSequences.forEach((seq) => {
      const seqWords = seq.text.split(/\s+/).filter((w: string) => w.length > 0);
      const wordCount = seqWords.length;
      const wordDuration = sequenceDuration / wordCount;
      
      seq.start = globalTime;
      seq.end = globalTime + sequenceDuration;
      seq.durationInFrames = Math.round(sequenceDuration * fps);
      
      // Create word timings
      seq.words = seqWords.map((word, wordIndex) => {
        const wordStart = globalTime + wordIndex * wordDuration;
        const wordEnd = wordStart + wordDuration;
        
        return {
          word: word,
          start: wordStart,
          end: wordEnd,
          durationInFrames: Math.round(wordDuration * fps)
        };
      });
      
      globalTime += sequenceDuration;
      sequences.push(seq);
    });
  });

  return sequences;
}

/**
 * Determine Veo3 aspect ratio based on format and dimensions
 * Veo3 only supports '9:16' (portrait/vertical) or '16:9' (landscape/horizontal)
 * 
 * @param format - Video/Avatar format (vertical, horizontal, square, custom, ads)
 * @param width - Video width (optional, required for custom format)
 * @param height - Video height (optional, required for custom format)
 * @returns Veo3 aspect ratio ('9:16' or '16:9')
 */
export function getVeo3AspectRatio(
  format: 'vertical' | 'horizontal' | 'square' | 'custom' | 'ads',
  width?: number,
  height?: number
): "9:16" | "16:9" {
  if (format === 'vertical' || format === 'ads' || format === 'square') {
    return '9:16';
  } else if (format === 'horizontal') {
    return '16:9';
  } else if (format === 'custom') {
    // For custom and ads formats, calculate based on width/height
    const videoWidth = width || 1080;
    const videoHeight = height || 1920;
    
    if (videoHeight >= videoWidth) {
      return '9:16'; // Portrait or square
    } else {
      return '16:9'; // Landscape
    }
  }

  // Default fallback
  return '9:16';
}

/**
 * Helper function to convert time to frames
 */
function timeToFrames(time: number, fps: number = 60): number {
  return Math.round(time * fps);
}

/**
 * Adjust word timings to eliminate gaps between words
 */
export function adjustWordTimings(words: IWord[]): IWord[] {
  const adjustedWords = [...words];
  
  // Adjust each word's end to match the next word's start (no gaps)
  for (let i = 0; i < adjustedWords.length - 1; i++) {
    adjustedWords[i].end = adjustedWords[i + 1].start;
    adjustedWords[i].durationInFrames = timeToFrames(adjustedWords[i].end - adjustedWords[i].start);
  }
  
  // Last word keeps its original timing
  const lastWord = adjustedWords[adjustedWords.length - 1];
  lastWord.durationInFrames = timeToFrames(lastWord.end - lastWord.start);
  
  return adjustedWords;
}

/**
 * Normalize text for comparison (remove punctuation, lowercase, trim)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Match words from original sequences with transcription words
 */
export function matchSequenceWords(
  originalSeqs: ISequence[], 
  transcriptionWords: IWord[],
  logger?: any
): { success: boolean; matchedSequences?: IWord[][]; remainingWords?: IWord[] } {
  // Get all words from original sequences
  const allOriginalWords = originalSeqs.flatMap(seq => seq.words.map(w => normalizeText(w.word)));
  const allTranscriptionWords = transcriptionWords.map(w => normalizeText(w.word));
  
  if (logger) {
    logger.log(`[VEO3_UPDATE] Matching words`, {
      originalWordsCount: allOriginalWords.length,
      transcriptionWordsCount: allTranscriptionWords.length,
      originalWords: allOriginalWords,
      transcriptionWords: allTranscriptionWords
    });
  }
  
  // Check if the word counts are similar
  const wordCountDifference = Math.abs(allOriginalWords.length - allTranscriptionWords.length);
  const averageWordCount = (allOriginalWords.length + allTranscriptionWords.length) / 2;
  const differencePercentage = (wordCountDifference / averageWordCount) * 100;
  
  if (logger) {
    logger.log(`[VEO3_UPDATE] Word count difference: ${differencePercentage.toFixed(2)}%`);
  }
  
  // Try to match sequences by word correlation
  const matchedSequences: IWord[][] = [];
  let transcriptionWordIndex = 0;
  let totalMatchedWords = 0;
  let totalOriginalWords = 0;
  
  for (const originalSeq of originalSeqs) {
    const originalSeqWords = originalSeq.words.map(w => normalizeText(w.word));
    const matchedWords: IWord[] = [];
    let matchedCount = 0;
    
    totalOriginalWords += originalSeqWords.length;
    
    // Try to find corresponding words in transcription
    for (let i = 0; i < originalSeqWords.length && transcriptionWordIndex < transcriptionWords.length; i++) {
      const originalWord = originalSeqWords[i];
      const originalWordObj = originalSeq.words[i];
      const transcriptionWord = normalizeText(transcriptionWords[transcriptionWordIndex].word);
      
      // Check if words match or are similar
      if (originalWord === transcriptionWord || 
          originalWord.includes(transcriptionWord) || 
          transcriptionWord.includes(originalWord)) {
        // Use original word text with transcription timings
        matchedWords.push({
          ...transcriptionWords[transcriptionWordIndex],
          word: originalWordObj.word
        });
        transcriptionWordIndex++;
        matchedCount++;
        totalMatchedWords++;
      } else {
        // Try next transcription word (in case one was missed)
        const nextTranscriptionWord = transcriptionWordIndex < transcriptionWords.length - 1 
          ? normalizeText(transcriptionWords[transcriptionWordIndex + 1].word)
          : '';
        
        if (originalWord === nextTranscriptionWord) {
          // Skip current transcription word, use next one
          transcriptionWordIndex++;
          // Use original word text with transcription timings
          matchedWords.push({
            ...transcriptionWords[transcriptionWordIndex],
            word: originalWordObj.word
          });
          transcriptionWordIndex++;
          matchedCount++;
          totalMatchedWords++;
        } else {
          // No match found, take the transcription word anyway
          if (transcriptionWordIndex < transcriptionWords.length) {
            // Use original word text with transcription timings
            matchedWords.push({
              ...transcriptionWords[transcriptionWordIndex],
              word: originalWordObj.word
            });
            transcriptionWordIndex++;
          }
        }
      }
    }
    
    // Calculate match quality for this sequence
    const matchQuality = originalSeqWords.length > 0 ? matchedCount / originalSeqWords.length : 0;
    
    if (logger) {
      logger.log(`[VEO3_UPDATE] Sequence matching`, {
        originalWordCount: originalSeqWords.length,
        matchedWordCount: matchedWords.length,
        originalWords: originalSeqWords,
        matchedWords: matchedWords.map(w => normalizeText(w.word)),
        matchedCount,
        matchQuality: `${(matchQuality * 100).toFixed(2)}%`
      });
    }
    
    matchedSequences.push(matchedWords);
  }
  
  // Check if there are remaining words in the transcription
  const remainingWords = transcriptionWordIndex < transcriptionWords.length 
    ? transcriptionWords.slice(transcriptionWordIndex)
    : [];
  
  // Calculate global match quality
  const globalMatchQuality = totalOriginalWords > 0 ? totalMatchedWords / totalOriginalWords : 0;
  
  if (logger) {
    logger.log(`[VEO3_UPDATE] Global matching result`, {
      totalOriginalWords,
      totalMatchedWords,
      globalMatchQuality: `${(globalMatchQuality * 100).toFixed(2)}%`,
      remainingWordsCount: remainingWords.length,
      remainingWords: remainingWords.map(w => normalizeText(w.word))
    });
  }
  
  // Accept the match if global quality is good (>70%) or if most words matched
  if (globalMatchQuality >= 0.7) {
    if (logger) {
      logger.log(`[VEO3_UPDATE] Successfully matched ${matchedSequences.length} sequences with ${remainingWords.length} remaining words`);
    }
    return { success: true, matchedSequences, remainingWords };
  }
  
  // If global quality is between 50% and 70%, check word count difference
  if (globalMatchQuality >= 0.5 && differencePercentage < 50) {
    if (logger) {
      logger.log(`[VEO3_UPDATE] Acceptable match quality (${(globalMatchQuality * 100).toFixed(2)}%) with ${differencePercentage.toFixed(2)}% word count difference`);
    }
    return { success: true, matchedSequences, remainingWords };
  }
  
  if (logger) {
    logger.warn(`[VEO3_UPDATE] Match quality too low (${(globalMatchQuality * 100).toFixed(2)}%), using fallback method`);
  }
  return { success: false };
}

/**
 * Recreate sequences from Veo3 transcription results
 */
export function recreateSequencesFromVeo3Results(
  results: Veo3TranscriptionResult[],
  originalSequencesByAudioIndex: Map<number, ISequence[]>,
  logger?: any
): ISequence[] {
  const newSequences: ISequence[] = [];
  let cumulativeTimeOffset = 0;
  
  // Process each result to adjust word timings
  const processedResults = results.map((result) => {
    const adjustedWords = adjustWordTimings(result.transcription.words.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      durationInFrames: 0 // Will be calculated
    })));
    
    if (logger) {
      logger.log(`[VEO3_UPDATE] Adjusted words for audioIndex ${result.audioIndex}`, {
        originalWordCount: result.transcription.words.length,
        adjustedWordCount: adjustedWords.length
      });
    }
    
    return {
      ...result,
      transcription: {
        ...result.transcription,
        words: adjustedWords
      }
    };
  });
  
  if (logger) {
    logger.log('[VEO3_UPDATE] Processed results with adjusted timings', { processedResults });
  }
  
  for (const result of processedResults) {
    const originalSeqs = originalSequencesByAudioIndex.get(result.audioIndex) || [];
    const targetSequenceCount = originalSeqs.length;
    
    if (logger) {
      logger.log(`[VEO3_UPDATE] Recreating ${targetSequenceCount} sequences for audioIndex ${result.audioIndex}`);
    }
    
    if (targetSequenceCount === 0) {
      if (logger) {
        logger.warn(`[VEO3_UPDATE] No original sequences found for audioIndex ${result.audioIndex}, skipping`);
      }
      continue;
    }
    
    const allWords = result.transcription.words;
    
    // Try to match words first
    const matchResult = matchSequenceWords(originalSeqs, allWords, logger);
    
    if (matchResult.success && matchResult.matchedSequences) {
      // Use matched sequences
      if (logger) {
        logger.log(`[VEO3_UPDATE] Using word-based matching for audioIndex ${result.audioIndex}`);
      }
      
      // If we have remaining words (audio bugs), we'll ignore them
      if (matchResult.remainingWords && matchResult.remainingWords.length > 0) {
        if (logger) {
          logger.log(`[VEO3_UPDATE] ⚠️ Ignoring ${matchResult.remainingWords.length} remaining words (audio bugs) - will truncate at last valid word`, {
            remainingWords: matchResult.remainingWords.map(w => w.word)
          });
        }
      }
      
      for (let seqIndex = 0; seqIndex < matchResult.matchedSequences.length; seqIndex++) {
        const sequenceWords = matchResult.matchedSequences[seqIndex];
        
        if (sequenceWords.length === 0) continue;
        
        // Get media from original sequence
        const originalMedia = originalSeqs[seqIndex]?.media;
        
        // Apply cumulative offset to word timings
        const adjustedSequenceWords = sequenceWords.map((word: IWord) => ({
          ...word,
          start: word.start + cumulativeTimeOffset,
          end: word.end + cumulativeTimeOffset
        }));
        
        const newSequence: ISequence = {
          text: sequenceWords.map((w: IWord) => w.word).join(' '),
          words: adjustedSequenceWords,
          start: adjustedSequenceWords[0].start,
          end: adjustedSequenceWords[adjustedSequenceWords.length - 1].end,
          durationInFrames: adjustedSequenceWords.reduce((sum: number, w: IWord) => sum + w.durationInFrames, 0),
          audioIndex: result.audioIndex,
          media: originalMedia
        };
        
        newSequences.push(newSequence);
        
        if (logger) {
          logger.log(`[VEO3_UPDATE] Created sequence ${seqIndex} (word-matched) for audioIndex ${result.audioIndex}`, {
            wordCount: sequenceWords.length,
            start: newSequence.start,
            end: newSequence.end,
            duration: newSequence.end - newSequence.start,
            hasMedia: !!originalMedia
          });
        }
      }
    } else {
      // Fallback to proportional distribution
      if (logger) {
        logger.log(`[VEO3_UPDATE] Using proportional distribution fallback for audioIndex ${result.audioIndex}`);
      }
      
      // Calculate how many words per sequence (proportional distribution)
      const wordsPerSequence = Math.ceil(allWords.length / targetSequenceCount);
      
      if (logger) {
        logger.log(`[VEO3_UPDATE] Distribution for audioIndex ${result.audioIndex}`, {
          totalWords: allWords.length,
          targetSequenceCount,
          wordsPerSequence
        });
      }
      
      for (let seqIndex = 0; seqIndex < targetSequenceCount; seqIndex++) {
        const startWordIndex = seqIndex * wordsPerSequence;
        const endWordIndex = Math.min((seqIndex + 1) * wordsPerSequence, allWords.length);
        
        if (startWordIndex >= allWords.length) break;
        
        const sequenceWords = allWords.slice(startWordIndex, endWordIndex);
        
        if (sequenceWords.length === 0) continue;
        
        // Get media from original sequence if it exists
        const originalMedia = originalSeqs[seqIndex]?.media;
        
        // Apply cumulative offset to word timings
        const adjustedSequenceWords = sequenceWords.map((word: IWord) => ({
          ...word,
          start: word.start + cumulativeTimeOffset,
          end: word.end + cumulativeTimeOffset
        }));
        
        const newSequence: ISequence = {
          text: sequenceWords.map((w: IWord) => w.word).join(' '),
          words: adjustedSequenceWords,
          start: adjustedSequenceWords[0].start,
          end: adjustedSequenceWords[adjustedSequenceWords.length - 1].end,
          durationInFrames: adjustedSequenceWords.reduce((sum: number, w: IWord) => sum + w.durationInFrames, 0),
          audioIndex: result.audioIndex,
          media: originalMedia
        };
        
        newSequences.push(newSequence);
        
        if (logger) {
          logger.log(`[VEO3_UPDATE] Created sequence ${seqIndex} (proportional) for audioIndex ${result.audioIndex}`, {
            wordCount: sequenceWords.length,
            start: newSequence.start,
            end: newSequence.end,
            duration: newSequence.end - newSequence.start,
            hasMedia: !!originalMedia
          });
        }
      }
    }
    
    // Update cumulative offset for next audioIndex
    if (newSequences.length > 0) {
      const lastCreatedSequence = newSequences[newSequences.length - 1];
      if (lastCreatedSequence.audioIndex === result.audioIndex) {
        cumulativeTimeOffset = lastCreatedSequence.end;
        if (logger) {
          logger.log(`[VEO3_UPDATE] Updated cumulative offset to ${cumulativeTimeOffset} (last valid word) after audioIndex ${result.audioIndex}`);
        }
      } else {
        // Fallback if something went wrong
        cumulativeTimeOffset += (result.transcription.end - result.transcription.start);
        if (logger) {
          logger.log(`[VEO3_UPDATE] Updated cumulative offset to ${cumulativeTimeOffset} (full duration) after audioIndex ${result.audioIndex}`);
        }
      }
    }
  }
  
  if (logger) {
    logger.log('[VEO3_UPDATE] All sequences recreated', {
      totalSequences: newSequences.length,
      finalDuration: newSequences.length > 0 ? newSequences[newSequences.length - 1].end : 0
    });
  }
  
  return newSequences;
}

/**
 * Create avatar renders from sequences (with actual durations excluding audio bugs)
 */
export function createAvatarRendersFromSequences(
  results: Veo3TranscriptionResult[],
  sequencesByAudioIndex: Map<number, ISequence[]>,
  logger?: any
): Veo3AvatarRender[] {
  if (logger) {
    logger.log('[VEO3_UPDATE] Creating avatar renders with actual durations (excluding audio bugs)');
  }
  
  const avatarRenders = results.map((result) => {
    const seqs = sequencesByAudioIndex.get(result.audioIndex) || [];
    const actualDuration = seqs.length > 0 
      ? seqs[seqs.length - 1].end - seqs[0].start
      : result.transcription.end - result.transcription.start;
    
    const startInFrames = result.audioIndex === 0 ? 0 : 
      timeToFrames(Array.from(sequencesByAudioIndex.entries())
        .filter(([idx]) => idx < result.audioIndex)
        .reduce((sum, [_, seqs]) => {
          if (seqs.length > 0) {
            return sum + (seqs[seqs.length - 1].end - seqs[0].start);
          }
          return sum;
        }, 0));
    
    if (logger) {
      logger.log(`[VEO3_UPDATE] Avatar render for audioIndex ${result.audioIndex}`, {
        actualDuration,
        originalDuration: result.transcription.end - result.transcription.start,
        truncated: actualDuration < (result.transcription.end - result.transcription.start)
      });
    }
    
    return {
      audioIndex: result.audioIndex,
      url: result.videoUrl,
      durationInSeconds: actualDuration,
      startInFrames
    };
  });
  
  if (logger) {
    logger.log('[VEO3_UPDATE] Avatar renders created', { avatarRenders });
  }
  
  return avatarRenders;
}

/**
 * Create voices from results (with actual durations excluding audio bugs)
 */
export function createVoicesFromResults(
  results: Veo3TranscriptionResult[],
  sequencesByAudioIndex: Map<number, ISequence[]>,
  voiceIdByAudioIndex: Map<number, string>,
  logger?: any
): Veo3Voice[] {
  if (logger) {
    logger.log('[VEO3_UPDATE] Creating voices with actual durations (excluding audio bugs)');
  }
  
  let voiceTimeOffset = 0;
  const voices = results.map((result, index) => {
    const seqs = sequencesByAudioIndex.get(result.audioIndex) || [];
    const actualDuration = seqs.length > 0 
      ? seqs[seqs.length - 1].end - seqs[0].start
      : result.transcription.end - result.transcription.start;
    
    const voice = {
      index: result.audioIndex,
      url: result.audioUrl,
      voiceId: voiceIdByAudioIndex.get(result.audioIndex),
      start: voiceTimeOffset,
      end: voiceTimeOffset + actualDuration,
      durationInFrames: timeToFrames(actualDuration)
    };
    
    voiceTimeOffset = voice.end;
    
    if (logger) {
      logger.log(`[VEO3_UPDATE] Created voice ${index}`, {
        audioIndex: voice.index,
        start: voice.start,
        end: voice.end,
        duration: voice.end - voice.start,
        actualDuration,
        originalDuration: result.transcription.end - result.transcription.start,
        truncated: actualDuration < (result.transcription.end - result.transcription.start)
      });
    }
    
    return voice;
  });
  
  if (logger) {
    logger.log('[VEO3_UPDATE] All voices created', {
      voiceCount: voices.length,
      totalDuration: voiceTimeOffset
    });
  }
  
  return voices;
}

