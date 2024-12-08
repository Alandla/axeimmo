import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect } from "react";
import googleFonts from "../../config/googleFonts.config";

export const SubtitleModern = ({ subtitleSequence, start, style }: { subtitleSequence: any, start: number, style: any }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    useEffect(() => {
        const loadFontByName = async (fontSelected: string) => {
            const font = googleFonts.find((font) => font.family === fontSelected);
            if (font) {
                await font.load();
            }
        };

        loadFontByName(style?.fontFamily || 'Montserrat');
        if (style?.activeWord?.isActive && style?.activeWord?.fontFamily !== style?.fontFamily) {
            loadFontByName(style?.activeWord.fontFamily || 'Montserrat');
        }
    }, [style?.fontFamily]);

    const shadowColor = style.shadow.color ? style.shadow.color : 'black';

    const verticalPosition = (style.position / 100) * 1750;

    const shadowSizes = [
        'none',
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 9px, ${shadowColor}80 0px 0px 10px, ${shadowColor}80 0px 0px 11px, ${shadowColor}80 0px 0px 12px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 10px, ${shadowColor}80 0px 0px 12px, ${shadowColor}80 0px 0px 14px, ${shadowColor}80 0px 0px 16px, ${shadowColor}80 0px 0px 18px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 11px, ${shadowColor}80 0px 0px 14px, ${shadowColor}80 0px 0px 17px, ${shadowColor}80 0px 0px 20px, ${shadowColor}80 0px 0px 23px, ${shadowColor}80 0px 0px 26px, ${shadowColor}80 0px 0px 29px, ${shadowColor}80 0px 0px 32px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 12px, ${shadowColor}80 0px 0px 16px, ${shadowColor}80 0px 0px 20px, ${shadowColor}80 0px 0px 24px, ${shadowColor}80 0px 0px 28px, ${shadowColor}80 0px 0px 32px, ${shadowColor}80 0px 0px 36px, ${shadowColor}80 0px 0px 40px, ${shadowColor}80 0px 0px 44px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 13px, ${shadowColor}80 0px 0px 18px, ${shadowColor}80 0px 0px 23px, ${shadowColor}80 0px 0px 28px, ${shadowColor}80 0px 0px 33px, ${shadowColor}80 0px 0px 38px, ${shadowColor}80 0px 0px 43px, ${shadowColor}80 0px 0px 48px, ${shadowColor}80 0px 0px 53px`,
    ];

    const getAnimationValues = () => {
        let scale = 1;
        let opacity = 1;
        let blurValue = 0;

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
            case 'blur':
                const blurAnimation = spring({
                    fps,
                    frame,
                    config: {
                      damping: 200,
                      stiffness: 100,
                      overshootClamping: true,
                    },
                  });
                
                  // Valeur du flou : réduit de 20px à 0px en 0.3 secondes
                blurValue = interpolate(
                    blurAnimation,
                    [0, 0.5],
                    [10, 0], // De 20px de flou à 0px
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                );
        }
        return { scale, opacity, blurValue };
    };

    const { scale, opacity, blurValue } = getAnimationValues();

    return (
        <AbsoluteFill
            style={{
                marginTop: `${verticalPosition}px`,
                zIndex: 10
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
                            const wordInSecondLine = lineIndex === 1;
                            const isSecondLineActive = lineIndex === 1 && ((frame+start) >= line.words[0]?.startInFrames && (frame+start) < (line.words[line.words.length - 1]?.startInFrames + line.words[line.words.length - 1]?.durationInFrames));

                            const wordStyle = wordInSecondLine && style.secondLine.isActive
                                ? {
                                    color: style.secondLine.color,
                                    fontSize: `${word.fontSize || style.secondLine.fontSize}px`,
                                    fontStyle: style.secondLine.isItalic ? 'italic' : 'normal',
                                    textTransform: style.secondLine.isUppercase ? 'uppercase' as const : 'none' as const,
                                    fontFamily: `${style.secondLine.fontFamily || 'Montserrat'}, sans-serif`,
                                    fontWeight: style.secondLine.fontWeight || 700,
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
                                        filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
                                        textAlign: 'center',
                                        lineHeight: '0.8',
                                        opacity: wordInSecondLine && !isSecondLineActive ? 0 : 1,
                                        textShadow: style.shadow.isActive ? shadowSizes[style.shadow.size] : 'none',
                                    }}>
                                        {word.word}{' '}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>
        </AbsoluteFill>
    );
};
