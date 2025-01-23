import { Sequence, useVideoConfig } from "remotion";
import {fillTextBox} from '@remotion/layout-utils';
import {useMemo} from 'react';
import { SubtitleSimple } from "./subtitleSimple";
import { Line, Sequence as SequenceType, SubtitleMode, Word } from "../../type/subtitle";

export const formatSubtitles = (
	sequences: SequenceType[],
	maxWidth: number,
	fontSize: number,
	fontFamily: string = 'Arial',
	style?: { isPunctuation?: boolean; fontSize?: number, fontFamily?: string, fontWeight?: number, isUppercase?: boolean, mode?: SubtitleMode }
) => {
	const subtitles: {
		lines: Line[];
		start: number;
		end: number;
		text: string;
		durationInFrames: number;
	}[] = [];

	// Créer la liste complète des mots
	const allWords: Word[] = sequences.reduce((acc, sequence) => {
		return [...acc, ...sequence.words];
	}, [] as Word[]);

	let startInFrame = Math.round(sequences[0].start*60) || 0;
	let mode = style?.mode || 'twoLines';

	if (mode === 'word') {
		// Un sous-titre par mot
		allWords.forEach((word) => {
			const processedWord = style?.isPunctuation 
				? word.word.replace(/[.,;!?]/g, '')
				: word.word;

			word.startInFrames = startInFrame;
			startInFrame += word.durationInFrames;

			subtitles.push({
				lines: [{ words: [{ ...word, word: processedWord }] }],
				start: word.start,
				end: word.end,
				text: word.word,
				durationInFrames: word.durationInFrames,
			});
		});
	} else {
		let box = fillTextBox({
			maxBoxWidth: maxWidth,
			maxLines: mode === 'twoLines' ? 2 : 1,
		});

		let currentLine: Line[] = mode === 'twoLines' ? [{words: []}, {words: []}] : [{words: []}];
		let durationInFrames = 0;
		let actualLine = 0;
		let text = '';

		allWords.forEach((word, index) => {
			const processedWord = style?.isPunctuation 
				? word.word.replace(/[.,;!?]/g, '')
				: word.word;

			const result = box.add({
				text: processedWord,
				fontFamily: `${style?.fontFamily || 'Montserrat'}, sans-serif`,
				fontWeight: style?.fontWeight || 700,
				fontSize: (style?.fontSize || 70) - 10,
				textTransform: style?.isUppercase ? 'uppercase' : 'none',
			});

			if (result.newLine && mode === 'twoLines' && actualLine < 1) {
				actualLine++;
			}

			if (result.exceedsBox) {
				if (currentLine[0].words.length > 0) {
					subtitles.push({
						lines: [...currentLine],
						start: currentLine[0].words[0].start,
						end: currentLine[actualLine].words[currentLine[actualLine].words.length - 1].end,
						text,
						durationInFrames,
					});
				}
				durationInFrames = word.durationInFrames;
				word.startInFrames = startInFrame;
				startInFrame += word.durationInFrames;
				currentLine = mode === 'twoLines' ? [{words: [{...word, word: processedWord}]}, {words: []}] : [{words: [{...word, word: processedWord}]}];
				actualLine = 0;
				text = word.word + ' ';
				box = fillTextBox({
					maxBoxWidth: maxWidth,
					maxLines: mode === 'twoLines' ? 2 : 1,
				});
			} else {
				durationInFrames += word.durationInFrames;
				word.startInFrames = startInFrame;
				startInFrame += word.durationInFrames;
				text += word.word + ' ';
				currentLine[actualLine].words.push({ ...word, word: processedWord });
			}

			if (index === allWords.length - 1 && currentLine.length > 0) {
				subtitles.push({
					lines: [...currentLine],
					start: currentLine[0].words[0].start,
					end: word.end,
					text: text,
					durationInFrames,
				});
			}
		});
	}

	return subtitles;
};

export const SubtitlesSimple = ({ subtitleSequences, style }: { subtitleSequences: any, style: any }) => {
	const { width } = useVideoConfig();

	const subtitles = useMemo(() => {
        const sub = formatSubtitles(subtitleSequences, width*0.5, 50, "Helvetica, sans-serif", style);
		return sub;
	}, [subtitleSequences, style]);

    let currentFrame = Math.round(subtitleSequences[0].words[0].startInFrames) || 0;
    
	return (
		<>
			{subtitles.map((subtitle, index) => {
				if (subtitle.durationInFrames === 0) {
					subtitle.durationInFrames = 1;
				}
				const element = (
					<Sequence key={index} from={currentFrame} durationInFrames={subtitle.durationInFrames}>
						<SubtitleSimple subtitleSequence={subtitle} start={currentFrame} style={style}/>
					</Sequence>
				);
				currentFrame += subtitle.durationInFrames;
				return element;
			})}
		</>
	);
};