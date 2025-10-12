import {Audio, Sequence} from 'remotion';
import { useMemo } from 'react';

interface Voice {
  url: string;
  index: number;
  start: number;
  end: number;
  durationInFrames: number;
  startOffset?: number;
}

export const Voices = ({voices, volume}: {voices: Voice[], volume: number}) => {
  // Memoize voice elements pour éviter les re-renders inutiles
  const voiceElements = useMemo(() => {
    let currentFrame = 0;

    return voices.map((voice) => {
      let element = null;
      if (voice.url) {
        element = (
          <Sequence key={voice.index} from={currentFrame} durationInFrames={voice.durationInFrames + 15} premountFor={60}>
            <Audio 
              src={voice.url}
              startFrom={voice.startOffset ? voice.startOffset : 0}
              volume={volume}
            />
          </Sequence>
        );
      }
      currentFrame += voice.durationInFrames;
      return element;
    });
  }, [voices, volume]);

  return <>{voiceElements}</>;
};