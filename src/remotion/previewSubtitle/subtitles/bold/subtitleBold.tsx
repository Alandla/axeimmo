import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect, useState } from "react";

export const SubtitleBold = ({ subtitleSequence, start, style }: { subtitleSequence: any, start: number, style: any }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const getAnimationValues = () => {
        let scale = 1;
        let opacity = 1;

        switch (style.animation?.appear) {
            case 'zoom':
                scale = spring({
                    fps,
                    frame,
                    from: 0.86,
                    to: 1,
                    config: {
                        mass: 0.5,
                        stiffness: 2,
                    },
                    durationInFrames: 6,
                });
                break;
            case 'bounce':
                scale = spring({
                    fps,
                    frame,
                    from: 0.7,
                    to: 1,
                    config: {
                        stiffness: 100,
                        damping: 10,
                    },
                    durationInFrames: 30,
                });
                break;
            case 'fade':
                opacity = spring({
                    fps,
                    frame,
                    from: 0,
                    to: 1,
                    config: {
                        mass: 1,
                        stiffness: 50,
                        damping: 20,
                    },
                    durationInFrames: 20,
                });
                break;
        }
        return { scale, opacity };
    };

    const { scale, opacity } = getAnimationValues();

    const shadowColor = style.shadow.color ? style.shadow.color : 'black';

    const verticalPosition = (style.position / 100) * 1750;

    const shadowSizes = [
        'none',
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 9px, ${shadowColor} 0px 0px 10px, ${shadowColor} 0px 0px 11px, ${shadowColor} 0px 0px 12px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 10px, ${shadowColor} 0px 0px 12px, ${shadowColor} 0px 0px 14px, ${shadowColor} 0px 0px 16px, ${shadowColor} 0px 0px 18px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 11px, ${shadowColor} 0px 0px 14px, ${shadowColor} 0px 0px 17px, ${shadowColor} 0px 0px 20px, ${shadowColor} 0px 0px 23px, ${shadowColor} 0px 0px 26px, ${shadowColor} 0px 0px 29px, ${shadowColor} 0px 0px 32px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 12px, ${shadowColor} 0px 0px 16px, ${shadowColor} 0px 0px 20px, ${shadowColor} 0px 0px 24px, ${shadowColor} 0px 0px 28px, ${shadowColor} 0px 0px 32px, ${shadowColor} 0px 0px 36px, ${shadowColor} 0px 0px 40px, ${shadowColor} 0px 0px 44px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 13px, ${shadowColor} 0px 0px 18px, ${shadowColor} 0px 0px 23px, ${shadowColor} 0px 0px 28px, ${shadowColor} 0px 0px 33px, ${shadowColor} 0px 0px 38px, ${shadowColor} 0px 0px 43px, ${shadowColor} 0px 0px 48px, ${shadowColor} 0px 0px 53px`,
    ];

    return (
        <AbsoluteFill
            style={{
                marginTop: `155px`,
            }}
        >
            <div 
                style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <div key={lineIndex}>
                        {line.words.map((word: Word, index: number) => {
                            const isWordActive = (frame+start) >= word.startInFrames && (frame+start) < (word.startInFrames + word.durationInFrames);

                            const wordStyle = isWordActive && style.activeWord.isActive
                                ? {
                                    color: style.activeWord.color,
                                    fontSize: `${style.activeWord.fontSize}px`,
                                    fontStyle: style.activeWord.isItalic ? 'italic' : 'normal',
                                    textTransform: style.activeWord.isUppercase ? 'uppercase' as const : 'none' as const,
                                    fontFamily: `${style.activeWord.fontFamily || 'Montserrat'}, sans-serif`,
                                    fontWeight: style.activeWord.fontWeight || 700,
                                  }
                                : {
                                    color: style.color,
                                    fontSize: `${style.fontSize}px`,
                                    fontStyle: style.isItalic ? 'italic' : 'normal',
                                    textTransform: style.isUppercase ? 'uppercase' as const : 'none' as const,
                                    fontFamily: `${style.fontFamily || 'Montserrat'}, sans-serif`,
                                    fontWeight: style.fontWeight || 700,
                                  };

                            return (
                                <span 
                                    key={index} 
                                    className="word"
                                    style={{
                                        ...wordStyle,
                                        textAlign: 'center',
                                        lineHeight: '1.2',
                                        textShadow: style.shadow.isActive ? shadowSizes[style.shadow.size] : 'none',
                                    }}>
                                        {word.word}{' '}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        </AbsoluteFill>
    );
}