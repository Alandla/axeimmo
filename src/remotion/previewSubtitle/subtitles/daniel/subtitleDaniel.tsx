import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";

export const SubtitleDaniel = ({ subtitleSequence, start, style }: { subtitleSequence: any, start: number, style: any }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Zoom animation with consistent speed
    const scale = spring({
        frame,
        fps,
        from: 0.8,
        to: 1.1,
        config: {
            damping: 200,
            stiffness: 50,
        },
        durationInFrames: 150, // Adjust for desired speed
    });

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

    return (
        <AbsoluteFill
            style={{
                marginTop: `180px`,
                zIndex: 10
            }}
        >
            <div 
                style={{
                    transform: `scale(${scale})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <div key={lineIndex}>
                        {line.words.map((word: Word, index: number) => {
                            const isWordAlreadyActive = (frame + start) >= word.startInFrames;

                            return (
                                <span 
                                    key={index} 
                                    className="word"
                                    style={{
                                        textAlign: 'center',
                                        lineHeight: '0.8',
                                        opacity: isWordAlreadyActive ? 1 : 0,
                                        color: style.color,
                                        fontSize: `${style.fontSize}px`,
                                        fontStyle: style.isItalic ? 'italic' : 'normal',
                                        textTransform: style.isUppercase ? 'uppercase' as const : 'none' as const,
                                        fontFamily: `${style.fontFamily || 'Montserrat'}, sans-serif`,
                                        fontWeight: style.fontWeight || 700,
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
