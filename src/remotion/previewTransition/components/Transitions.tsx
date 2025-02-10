
import { OffthreadVideo, Sequence } from 'remotion';
import { ITransition } from '../type/transition';
import type { CSSProperties } from 'react';

export const timeToFrames = (time: number, fps: number = 60): number => Math.round(time * fps);

export const Transitions = ({transition}: {transition: ITransition}) => {
  
  const startAt = 50 - (transition.fullAt || 0);
  return (
    <>
        <Sequence from={startAt} durationInFrames={transition.durationInFrames} premountFor={20}>
          <OffthreadVideo
            src={transition.video}
            volume={0}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              mixBlendMode: (transition.mode as CSSProperties['mixBlendMode']) || 'normal',
              zIndex: 3
            }}
          />
        </Sequence>
    </>
  );
};