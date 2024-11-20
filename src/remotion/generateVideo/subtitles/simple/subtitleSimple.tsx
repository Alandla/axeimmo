import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Line, Word } from "./subtitlesSimple";

export const SubtitleSimple = ({ subtitleSequence, start }: { subtitleSequence: any, start: number }) => {
    const frame = useCurrentFrame();
    
    return (
        <AbsoluteFill>
            <svg width="100%" height="100%">
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <text 
                        key={lineIndex}
                        x="50%" 
                        y={`${50 + (lineIndex * 4)}%`}
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="60px"
                        fontFamily="Helvetica, sans-serif"
                        paintOrder="stroke"
                        stroke="black"
                        strokeWidth="15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <tspan>
                            {line.words.map((word: Word, index: number) => (
                                <tspan key={index} className="word">
                                    {word.word}{' '}
                                </tspan>
                            ))}
                        </tspan>
                    </text>
                ))}
            </svg>
        </AbsoluteFill>
    );
};