import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame } from "remotion";
import {fillTextBox} from '@remotion/layout-utils';
import {useMemo} from 'react';
import { Word } from "./subtitles";

export const Subtitle = ({ subtitleSequence, start }: { subtitleSequence: any, start: number }) => {
    const frame = useCurrentFrame();
    
    return (
        <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: '500px',
            zIndex: 10,
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '80%',
                columnGap: '0.8rem',
                alignSelf: 'center',
            }}>
                {subtitleSequence.words.map((word : Word, index : number) => {
                    const isWordActive = (frame+start) >= word.startInFrames && (frame+start) < (word.startInFrames + word.durationInFrames);
                    
                    return (
                        <span key={index} style={{
                            fontSize: '60px',
                            color: '#ffffff',
                            fontFamily: 'Helvetica, sans-serif',
                            display: 'inline-block',
                        }}>
                            {word.word}
                        </span>
                    )
                })}
            </div>
        </div>
    );
};