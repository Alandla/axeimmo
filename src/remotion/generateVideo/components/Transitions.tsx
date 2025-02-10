import {Audio, Sequence, OffthreadVideo} from 'remotion';
import { ITransition } from '../type/transition';
import type { CSSProperties } from 'react';

export const timeToFrames = (time: number, fps: number = 60): number => Math.round(time * fps);

export const Transitions = ({sequences, transitions}: {sequences: any[], transitions: ITransition[]}) => {
  return (
    <>
      {transitions.map((transition, index) => {
        
        // Calculer le total des frames des séquences précédentes
        const totalFramesBefore = sequences
          .slice(0, (transition.indexSequenceBefore ?? 0) + 1)
          .reduce((acc, seq) => acc + (seq.durationInFrames || 0), 0);
        
        // Calculer le moment où la transition doit commencer
        const startAt = totalFramesBefore - (transition.fullAt ?? 0);
        const soundStartAt = totalFramesBefore - (transition.soundPeakAt === 0 ? (transition.fullAt ?? 0) : (transition.soundPeakAt ?? 0));

        return (
          <>
            <Sequence key={index} from={startAt} durationInFrames={transition.durationInFrames} premountFor={20}>
              {/* Vidéo de transition */}
              <OffthreadVideo
                src={transition.video}
                volume={0} // La vidéo n'a pas de son car on utilise un fichier audio séparé
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  mixBlendMode: (transition.mode as CSSProperties['mixBlendMode']) || 'normal',
                  zIndex: 3
                }}
              />
            </Sequence>
            <Sequence key={`sound-${index}`} from={soundStartAt} durationInFrames={transition.durationInFrames} premountFor={20}>
              <Audio
                src={transition.sound}
                volume={transition.volume}
              />
            </Sequence>
          </>
        );
      })}
    </>
  );
};