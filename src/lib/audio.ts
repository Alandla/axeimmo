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

    if (!relatedSequences) {
        throw new Error('No related sequences found');
    }

    let updatedVideo = {...video};

    let updatedSequences = updateSequenceTimings(relatedSequences, transcription.transcription.utterances[0].words);
    const offset = relatedSequences[0].start;
    updatedSequences = adjustSequenceTimings(updatedSequences, transcription.metadata.audio_duration + offset);

    let newSequences = [...updatedVideo?.video?.sequences || []];
    
    // Trouver l'index de la dernière séquence concernée
    const lastUpdatedSequenceIndex = newSequences.findIndex(seq => 
        seq.audioIndex === audioIndex && 
        seq.text === updatedSequences[updatedSequences.length - 1].text
    );

    // Calculer la différence de durée
    const voice = video?.video?.audio?.voices.find(v => v.index === audioIndex);
    const oldDuration = (voice?.end || 0) - (voice?.start || 0);
    const newDuration = transcription.metadata.audio_duration;
    const durationDifference = newDuration - oldDuration;

    // Mettre à jour les séquences modifiées
    updatedSequences.forEach(updatedSeq => {
        const index = newSequences.findIndex(seq => 
            seq.audioIndex === audioIndex && seq.text === updatedSeq.text
        );
        if (index !== -1) {
            newSequences[index] = updatedSeq;
        }
    });

    // Ajuster les timings des séquences suivantes
    for (let i = lastUpdatedSequenceIndex + 1; i < newSequences.length; i++) {
        const currentSequence = newSequences[i];
        
        // Ajuster les timings de la séquence
        currentSequence.start += durationDifference;
        currentSequence.end += durationDifference;
        
        // Ajuster les timings de chaque mot
        currentSequence.words = currentSequence.words.map(word => ({
            ...word,
            start: word.start + durationDifference,
            end: word.end + durationDifference
        }));
    }

    // Mettre à jour la durée totale
    let duration = ((video.video?.metadata?.audio_duration || 0) - oldDuration) + newDuration;

    if (!updatedVideo.video) {
        throw new Error('Video object is undefined');
    }

    updatedVideo = updateVideoWithNewAudio(video, audioIndex, audioUrl, transcription.metadata.audio_duration, duration);
    
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
  audioDuration: number,
  duration: number
): IVideo {

  if (!video?.video?.audio) {
    throw new Error('No audio found');
  }

  const durationInFrames = timeToFrames(audioDuration);

  const newVoices = video.video.audio.voices.map(voice => {
    if (voice.index === audioIndex) {
      return {
        ...voice,
        url: audioUrl,
        durationInFrames
      };
    }
    return voice;
  });

  return {
    ...video,
    video: {
      ...video.video,
      audio: {
        ...video.video.audio,
        voices: newVoices
      },
      metadata: {
        ...video.video.metadata,
        audio_duration: duration
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

  const offset = sequences[0].start;
  
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
          start: transcriptionWords[currentTranscriptionIndex].start + offset,
          end: transcriptionWords[currentTranscriptionIndex].end + offset,
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
              start: transcriptionWords[j].start + offset,
              end: transcriptionWords[j].end + offset,
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
              start: prevWord.end + offset,
              end: nextWord.start + offset,
              confidence: 0.5,
              durationInFrames: timeToFrames(nextWord.start - prevWord.end)
            };
          } else if (prevWord) {
            // Estimation basée sur le mot précédent
            const avgWordDuration = 0.3; // Durée moyenne estimée d'un mot
            newWords[i] = {
              ...newWords[i],
              start: prevWord.end + offset,
              end: prevWord.end + avgWordDuration + offset,
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
      durationInFrames: duration,
      originalText: sequence.text,
      needsAudioRegeneration: false
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
