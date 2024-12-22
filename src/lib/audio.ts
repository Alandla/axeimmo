import { ISequence, IVideo, IWord } from '../types/video';
import { basicApiCall } from './api';
import { adjustSequenceTimings, timeToFrames } from './transcription';

interface RegenerateAudioResult {
  audioUrl: string;
  cost: number;
  transcriptionId: string;
}

export async function regenerateAudioForSequence(
  video: IVideo,
  sequenceIndex: number
): Promise<RegenerateAudioResult> {
  const audioIndex = video?.video?.sequences[sequenceIndex].audioIndex;
  console.log("audioIndex", audioIndex)
  const relatedSequences = video?.video?.sequences.filter(seq => seq.audioIndex === audioIndex);
  console.log("relatedSequences", relatedSequences)
  
  if (!relatedSequences || audioIndex === undefined) {
    throw new Error('No related sequences found');
  }

  const completeText = relatedSequences
    .sort((a, b) => a.start - b.start)
    .map(seq => seq.text)
    .join(' ');

  const res = await basicApiCall('/audio/generate', {
    text: completeText,
    voiceId: video?.video?.audio?.voices[audioIndex].voiceId,
  });

  return res as RegenerateAudioResult;
}

export function updateVideoTimings(video: IVideo, audioIndex: number, audioUrl: string, transcription: any) {

    const relatedSequences = video?.video?.sequences.filter(seq => seq.audioIndex === audioIndex);

    console.log("relatedSequences", relatedSequences)

    if (!relatedSequences) {
        throw new Error('No related sequences found');
    }

    let updatedVideo = {...video};

    let updatedSequences = updateSequenceTimings(relatedSequences, transcription.transcription.utterances[0].words);
    updatedSequences = adjustSequenceTimings(updatedSequences, transcription.metadata.audio_duration);
    console.log("updatedSequences", updatedSequences)

    let newSequences = [...updatedVideo?.video?.sequences || []];
    updatedSequences.forEach(updatedSeq => {
        const index = newSequences.findIndex(seq => 
            seq.audioIndex === audioIndex && seq.text === updatedSeq.text
        );
        if (index !== -1) {
            newSequences[index] = updatedSeq;
        }
    });

    console.log("audio_duration", video?.video?.metadata?.audio_duration)

    const oldDuration = (video?.video?.audio?.voices[audioIndex]?.end || 0) - (video?.video?.audio?.voices[audioIndex]?.start || 0);
    const newDuration = transcription.metadata.audio_duration;
    let duration = ((video.video?.metadata?.audio_duration || 0) - oldDuration) + newDuration;

    if (!updatedVideo.video) {
        throw new Error('Video object is undefined');
    }

    updatedVideo.video.metadata.audio_duration = duration;

    updatedVideo = updateVideoWithNewAudio(video, audioIndex, audioUrl, transcription.metadata.audio_duration);
    
    updatedVideo = {
        ...updatedVideo,
        video: {
            ...updatedVideo?.video,
            thumbnail: updatedVideo?.video?.thumbnail || '',
            subtitle: updatedVideo?.video?.subtitle || {},
            metadata: updatedVideo?.video?.metadata || {
                audio_duration: 0,
                number_of_distinct_channels: 0,
                billing_time: 0,
                transcription_time: 0
            },
            sequences: newSequences
        }
    };

    return updatedVideo;
}

export function updateVideoWithNewAudio(
  video: IVideo,
  audioIndex: number,
  audioUrl: string,
  audioDuration: number
): IVideo {

  if (!video?.video?.audio) {
    throw new Error('No audio found');
  }

  const durationInFrames = timeToFrames(audioDuration);

  const newVoices = [...video.video.audio.voices];
  newVoices[audioIndex] = {
    ...newVoices[audioIndex],
    url: audioUrl,
    durationInFrames
  };

  return {
    ...video,
    video: {
      ...video.video,
      audio: {
        ...video.video.audio,
        voices: newVoices
      },
      sequences: video.video.sequences.map(seq => {
        if (seq.audioIndex === audioIndex) {
          return {
            ...seq,
            originalText: seq.text,
            needsAudioRegeneration: false
          };
        }
        return seq;
      })
    }
  };
}

export function updateSequenceTimings(
  sequences: ISequence[],
  transcriptionWords: IWord[],
): ISequence[] {
  let currentTranscriptionIndex = 0;
  
  return sequences.map(sequence => {
    const newWords = [...sequence.words];
    
    for (let i = 0; i < newWords.length; i++) {
      // Si on a dépassé la longueur de la transcription, on arrête
      if (currentTranscriptionIndex >= transcriptionWords.length) break;

      const originalWord = newWords[i].word.toLowerCase().replace(/[.,!?]$/, '');
      if (!originalWord) {
        continue;
      }
      let transcriptionWord = transcriptionWords[currentTranscriptionIndex].word.toLowerCase().trim().replace(/[.,!?]$/, '');

      // Si les mots correspondent, on met à jour les timings
      if (originalWord === transcriptionWord) {
        console.log("Je trouve :", originalWord)
        newWords[i] = {
          ...newWords[i],
          start: transcriptionWords[currentTranscriptionIndex].start,
          end: transcriptionWords[currentTranscriptionIndex].end,
          confidence: transcriptionWords[currentTranscriptionIndex].confidence,
          durationInFrames: timeToFrames(transcriptionWords[currentTranscriptionIndex].end - transcriptionWords[currentTranscriptionIndex].start)
        };
        currentTranscriptionIndex++;
      } else {
        // Chercher le prochain mot correspondant dans la transcription
        console.log("Je n'ai pas trouve :", originalWord)
        let found = false;
        for (let j = currentTranscriptionIndex; j < currentTranscriptionIndex + 3 && j < transcriptionWords.length; j++) {
          const nextTranscriptionWord = transcriptionWords[j].word.toLowerCase().trim().replace(/[.,!?]$/, '');
          console.log("Je cherche :", nextTranscriptionWord)
          if (originalWord === nextTranscriptionWord) {
            newWords[i] = {
              ...newWords[i],
              start: transcriptionWords[j].start,
              end: transcriptionWords[j].end,
              confidence: transcriptionWords[j].confidence,
              durationInFrames: timeToFrames(transcriptionWords[j].end - transcriptionWords[j].start)
            };
            currentTranscriptionIndex = j + 1;
            found = true;
            break;
          }
        }

        // Si on ne trouve pas de correspondance, on estime les timings
        if (!found) {
          const prevWord = i > 0 ? newWords[i - 1] : null;
          const nextWord = i < newWords.length - 1 ? newWords[i + 1] : null;

          if (prevWord && nextWord) {
            newWords[i] = {
              ...newWords[i],
              start: prevWord.end,
              end: nextWord.start,
              confidence: 0.5,
              durationInFrames: timeToFrames(nextWord.start - prevWord.end)
            };
          } else if (prevWord) {
            // Estimation basée sur le mot précédent
            const avgWordDuration = 0.3; // Durée moyenne estimée d'un mot
            newWords[i] = {
              ...newWords[i],
              start: prevWord.end,
              end: prevWord.end + avgWordDuration,
              confidence: 0.5,
              durationInFrames: timeToFrames(avgWordDuration)
            };
          }
          currentTranscriptionIndex++;
        }
      }
    }

    const duration = newWords.reduce((total, word) => total + (word.durationInFrames || 0), 0);

    return {
      ...sequence,
      words: newWords,
      start: newWords[0].start,
      end: newWords[newWords.length - 1].end,
      durationInFrames: duration
    };
  });
}

export const waitForTranscription = async (
  transcriptionId: string, 
  maxAttempts = 100, 
  delaySeconds = 2
) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const transcriptionStatus : any = await basicApiCall('/audio/getTranscription', {
        transcriptionId
      }); 

      if (transcriptionStatus.status === 'done') {
        return transcriptionStatus.result;
      }

      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      attempts++;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du statut de transcription:', error);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      attempts++;
    }
  }

  throw new Error('Nombre maximum de tentatives atteint sans obtenir un statut "done" pour la transcription.');
};
