import { ITransition, ISequence } from '@/src/types/video';
import {Audio, Sequence, Video} from 'remotion';

export const timeToFrames = (time: number, fps: number = 60): number => Math.round(time * fps);

export const Transitions = ({sequences, transitions}: {sequences: ISequence[], transitions: ITransition[]}) => {
  return (
    <>
      {transitions.map((transition, index) => {
        
        // Calculer le total des frames des séquences précédentes
        const totalFramesBefore = sequences
          .slice(0, transition.indexSequenceBefore + 1)
          .reduce((acc, seq) => acc + (seq.durationInFrames || 0), 0);
        
        // Calculer le moment où la transition doit commencer
        const startAt = totalFramesBefore - (transition.fullAt || 0);

        console.log(totalFramesBefore)
        console.log(startAt)

        return (
          <Sequence key={index} from={startAt} durationInFrames={transition.durationInFrames}>
            {/* Vidéo de transition */}
            <Video
              src={transition.video}
              volume={0} // La vidéo n'a pas de son car on utilise un fichier audio séparé
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                mixBlendMode: 'lighten'
              }}
            />
            
            {/* Audio de transition */}
            <Audio
              src={transition.sound}
              volume={transition.volume}
            />
          </Sequence>
        );
      })}
    </>
  );
};