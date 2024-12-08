import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";

export const SubtitleClean = ({ subtitleSequence, start, style }: { subtitleSequence: any, start: number, style: any }) => {
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

    const verticalPosition = (style.position / 100) * 1750;

    return (
        <AbsoluteFill
            style={{
                marginTop: `210px`,
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
                    position: 'relative',
                    width: 'fit-content',
                    margin: '0 auto',
                }}
            >
                {style.background.isActive && style.background.mode === 'full' && (
                    <div style={{
                        position: 'absolute',
                        zIndex: 3,
                        top: '-10px',
                        bottom: '-10px',
                        left: `-10px`,
                        right: `-10px`,
                        backgroundColor: style.background.color || 'red',
                        borderRadius: style.background.radius,
                    }}></div>
                )}
                
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => {
                    let isLineActive = false;
                    if (line.words.length > 0) {
                        isLineActive = (frame+start) >= line.words[0].startInFrames && 
                            (frame+start) < (line.words[line.words.length - 1].startInFrames + 
                            line.words[line.words.length - 1].durationInFrames);
                    }

                    return (
                        <div key={lineIndex} style={{ position: 'relative' }}>
                            {style.background.isActive && 
                             style.background.mode === 'line' && 
                             isLineActive && (
                                <div style={{
                                    position: 'absolute',
                                    zIndex: 3,
                                    top: '-10px',
                                    bottom: '-10px',
                                    left: `-10px`,
                                    right: `-10px`,
                                    backgroundColor: style.background.color || 'red',
                                    borderRadius: style.background.radius,
                                }}></div>
                            )}
                            
                            {line.words.map((word: Word, index: number) => {
                                const isWordAlreadyActive = (frame+start) >= word.startInFrames;

                                const wordStyle = isWordAlreadyActive && style.activeWord.isActive
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
                                    <div key={index} style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        paddingLeft: '0.5rem',
                                        paddingRight: '0.5rem',
                                    }}>
                                        {style.background.isActive && 
                                         style.background.mode === 'word' && 
                                         isWordAlreadyActive && (
                                            <div style={{
                                                position: 'absolute',
                                                zIndex: 3,
                                                top: '-10px',
                                                bottom: '-10px',
                                                left: `-10px`,
                                                right: `-10px`,
                                                backgroundColor: style.background.color || 'red',
                                                borderRadius: style.background.radius,
                                            }}></div>
                                        )}
                                        <span 
                                            className="word"
                                            style={{
                                                ...wordStyle,
                                                position: 'relative',
                                                zIndex: 5,
                                                textAlign: 'center',
                                                lineHeight: '1.2',
                                            }}>
                                                {word.word}{' '}
                                        </span>
                                    </div>
                                )
                                })}
                            </div>
                        )
                    })}
                </div>
        </AbsoluteFill>
    );
}