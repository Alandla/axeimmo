import { ITransition } from '@/src/types/video';
import { Sequence, Video } from 'remotion';

export const timeToFrames = (time: number, fps: number = 60): number => Math.round(time * fps);

export const Transitions = ({transition}: {transition: ITransition}) => {
  
  const startAt = 10 - (transition.fullAt || 0);
  return (
    <>
        <Sequence from={startAt} durationInFrames={transition.durationInFrames}>
          <Video
            src={transition.video}
            volume={0}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              mixBlendMode: 'lighten'
            }}
          />
        </Sequence>
    </>
  );
};