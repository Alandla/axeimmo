import {Audio, Sequence} from 'remotion';

interface Voice {
  url: string;
  index: number;
  start: number;
  end: number;
  durationInFrames: number;
}

export const Voices = ({voices, volume}: {voices: Voice[], volume: number}) => {
  let currentFrame = 0;

  return (
    <>
      {voices.map((voice) => {
        const element = (   
          <Sequence key={voice.index} from={currentFrame} durationInFrames={voice.durationInFrames + 15}>
            <Audio 
              src={voice.url}
              startFrom={0}
              volume={volume}
            />
          </Sequence>
        );
        currentFrame += voice.durationInFrames;
        return element;
      })}
    </>
  );
};