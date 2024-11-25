import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";

export const SubtitleSimple = ({ subtitleSequence, start, style }: { subtitleSequence: any, start: number, style: any }) => {
    const frame = useCurrentFrame();
    
    return (
        <AbsoluteFill>
            <svg width="100%" height="100%">
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <text 
                        key={lineIndex}
                        x="50%" 
                        y={`${45 + (lineIndex * 15)}%`}
                        textAnchor="middle" 
                        dominantBaseline="middle"
                    >
                        <tspan>
                            {line.words.map((word: Word, index: number) => {
                                const isWordActive = (frame+start) >= word.startInFrames && (frame+start) < (word.startInFrames + word.durationInFrames);

                                const wordStyle = isWordActive && style?.activeWord?.isActive
                                    ? {
                                        fill: style?.activeWord?.color,
                                        fontSize: `${style?.activeWord?.fontSize}px`,
                                        fontStyle: style?.activeWord?.isItalic ? 'italic' : 'normal',
                                        fontFamily: `${style?.activeWord?.fontFamily || 'Montserrat'}, sans-serif`,
                                        fontWeight: style?.activeWord?.fontWeight || 700,
                                      }
                                    : {
                                        fill: style?.color,
                                        fontSize: `${style?.fontSize}px`,
                                        fontStyle: style?.isItalic ? 'italic' : 'normal',
                                        fontFamily: `${style?.fontFamily || 'Montserrat'}, sans-serif`,
                                        fontWeight: style?.fontWeight || 700,
                                      };
                                      
                                return (
                                    <tspan 
                                        key={index}
                                        paintOrder="stroke"
                                        stroke={style?.border?.isActive ? style?.border?.color : 'transparent'}
                                        strokeWidth={style?.border?.size}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        {...wordStyle}
                                    >
                                        {(isWordActive && style?.activeWord?.isActive && style?.activeWord?.isUppercase) ? word.word.toUpperCase() : (style?.isUppercase ? word.word.toUpperCase() : word.word)}{' '}
                                    </tspan>
                                )
                            })}
                        </tspan>
                    </text>
                ))}
            </svg>
        </AbsoluteFill>
    );
};