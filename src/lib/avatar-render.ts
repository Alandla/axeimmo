import { IVideo } from '../types/video';

export interface AvatarRenderData {
  audioIndex: number
  audioUrl: string
  start?: number
  end?: number
  startInFrames: number
  durationInSeconds: number
  firstWordStart?: number
  lastWordEnd?: number
}

// Generate list of avatar renders needed for heygen-iv model
export const generateAvatarRenderList = (video: IVideo): AvatarRenderData[] => {
  if (!video.video?.sequences || !video.video?.audio?.voices) {
    return [];
  }

  const avatarRenders: AvatarRenderData[] = [];
  const sequences = video.video.sequences;
  const voices = video.video.audio.voices;

  let currentRender: AvatarRenderData | null = null;
  let lastSequenceIndexInRender: number | null = null;

  for (let i = 0; i < sequences.length; i++) {
    const sequence = sequences[i];
    const showAvatar = sequence.media?.show === 'hide' || sequence.media?.show === 'half';

    if (showAvatar) {
      // Find the corresponding voice
      const voice = voices.find(v => v.index === sequence.audioIndex);
      if (!voice) continue;

      // Check if we should continue the current render or start a new one
      const shouldContinue = currentRender && 
                            lastSequenceIndexInRender === i - 1 && 
                            currentRender.audioIndex === sequence.audioIndex;

      if (!shouldContinue) {
        // Save previous render if exists
        if (currentRender) {
          avatarRenders.push(currentRender);
        }

        // Calculate startInFrames: sum of all durationInFrames of voices before this audioIndex
        let startInFrames = 0;
        for (const v of voices) {
          if (v.index < sequence.audioIndex) {
            startInFrames += v.durationInFrames;
          } else {
            break;
          }
        }

        // Check if this is the first sequence of this audioIndex
        const firstSequenceOfAudio = sequences.find(s => s.audioIndex === sequence.audioIndex);
        const isFirstOfAudioIndex = firstSequenceOfAudio && sequences.indexOf(firstSequenceOfAudio) === i;

        // Calculate start time (if not the first sequence of this audioIndex)
        let start: number | undefined = undefined;
        let firstWordStart: number | undefined = undefined;
        
        if (!isFirstOfAudioIndex) {
          // Not the first sequence, find the last word of previous sequence
          const prevSequence = sequences[i - 1];
          if (prevSequence.words && prevSequence.words.length > 0) {
            const lastWord = prevSequence.words[prevSequence.words.length - 1];
            start = lastWord.start - voice.start;
            firstWordStart = lastWord.start; // Use the start timestamp of this word
            
            // Add startOffset if present
            if (voice.startOffset) {
              start += voice.startOffset;
            }
          }

          // Add durationInFrames of all words from the start of this audioIndex until the previous sequence
          // But exclude the last word of the previous sequence (where we start cutting)
          for (let j = 0; j < i; j++) {
            const prevSeq = sequences[j];
            if (prevSeq.audioIndex === sequence.audioIndex && prevSeq.words) {
              // If this is the sequence right before (i-1), exclude the last word
              if (j === i - 1) {
                for (let k = 0; k < prevSeq.words.length - 1; k++) {
                  startInFrames += prevSeq.words[k].durationInFrames;
                }
              } else {
                // For other sequences, add all words
                for (const word of prevSeq.words) {
                  startInFrames += word.durationInFrames;
                }
              }
            }
          }
        } else {
          // First sequence of this audioIndex, use the first word of current sequence
          if (sequence.words && sequence.words.length > 0) {
            firstWordStart = sequence.words[0].start;
          }
        }

        // Create new render (duration will be calculated later when we know the end)
        currentRender = {
          audioIndex: sequence.audioIndex,
          audioUrl: voice.url,
          start,
          startInFrames,
          durationInSeconds: 0, // Will be calculated later
          firstWordStart
        };
      }

      // Update lastWordEnd with the last word of current sequence
      if (currentRender && sequence.words && sequence.words.length > 0) {
        currentRender.lastWordEnd = sequence.words[sequence.words.length - 1].end;
      }

      lastSequenceIndexInRender = i;

      // Check if we need to set end time (if next sequence doesn't show avatar or has different audioIndex)
      const nextSequence = sequences[i + 1];
      const isLastSequenceOfRender = !nextSequence || 
                                     nextSequence.media?.show !== 'hide' && nextSequence.media?.show !== 'half' ||
                                     nextSequence.audioIndex !== sequence.audioIndex;

      if (isLastSequenceOfRender && currentRender) {
        // Calculate end time if not the last sequence of this audioIndex
        const lastSequenceOfAudio = sequences.filter(s => s.audioIndex === sequence.audioIndex).pop();
        if (lastSequenceOfAudio && sequences.indexOf(lastSequenceOfAudio) !== i && nextSequence) {
          if (nextSequence.words && nextSequence.words.length > 0) {
            const firstWord = nextSequence.words[0];
            currentRender.end = firstWord.end - voice.start;
            
            // Add startOffset if present
            if (voice.startOffset) {
              currentRender.end += voice.startOffset;
            }
            
            // Update lastWordEnd with the end of the first word of next sequence
            currentRender.lastWordEnd = firstWord.end;
          }
        }
        
        // Calculate duration in seconds based on actual word timestamps
        if (currentRender.firstWordStart !== undefined && currentRender.lastWordEnd !== undefined) {
          currentRender.durationInSeconds = currentRender.lastWordEnd - currentRender.firstWordStart;
        }
        
        // Clean up temporary properties before saving
        delete currentRender.firstWordStart;
        delete currentRender.lastWordEnd;
        
        avatarRenders.push(currentRender);
        currentRender = null;
        lastSequenceIndexInRender = null;
      }
    } else {
      // Avatar is hidden, save current render if exists
      if (currentRender) {
        // Calculate duration in seconds based on actual word timestamps
        if (currentRender.firstWordStart !== undefined && currentRender.lastWordEnd !== undefined) {
          currentRender.durationInSeconds = currentRender.lastWordEnd - currentRender.firstWordStart;
        }
        
        // Clean up temporary properties before saving
        delete currentRender.firstWordStart;
        delete currentRender.lastWordEnd;
        
        avatarRenders.push(currentRender);
        currentRender = null;
        lastSequenceIndexInRender = null;
      }
    }
  }

  // Save last render if exists
  if (currentRender) {
    // Calculate duration in seconds based on actual word timestamps
    if (currentRender.firstWordStart !== undefined && currentRender.lastWordEnd !== undefined) {
      currentRender.durationInSeconds = currentRender.lastWordEnd - currentRender.firstWordStart;
    }
    
    // Clean up temporary properties before saving
    delete currentRender.firstWordStart;
    delete currentRender.lastWordEnd;
    
    avatarRenders.push(currentRender);
  }

  return avatarRenders;
};

