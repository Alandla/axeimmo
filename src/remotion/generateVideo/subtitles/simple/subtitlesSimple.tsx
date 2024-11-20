import { Sequence } from "remotion";
import {fillTextBox} from '@remotion/layout-utils';
import {useMemo} from 'react';
import { SubtitleSimple } from "./subtitleSimple";

export type Word = {
	word: string;
	start: number;
	end: number;
	confidence: number;
	durationInFrames: number;
	startInFrames: number;
};

export type Line = {
	words: Word[];
}

type Sequence = {
	words: Word[];
	text: string;
	start: number;
	end: number;
	durationInFrames?: number;
	audioUrl?: string;
	keywords?: Array<{
	search: 'stock' | 'web';
	keyword: string;
	precision: 'hard' | 'normal' | 'easy';
	}>;
};

type SubtitleMode = 'word' | 'line' | 'twoLines';

export const formatSubtitles = (
	sequences: Sequence[],
	mode: SubtitleMode,
	maxWidth: number,
	fontSize: number,
	fontFamily: string = 'Arial'
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

	let startInFrame = 0;

	if (mode === 'word') {
		// Un sous-titre par mot
		allWords.forEach((word) => {
			subtitles.push({
				lines: [{ words: [word] }],
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
			const result = box.add({
				text: word.word,
				fontFamily,
				fontSize,
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
				currentLine = mode === 'twoLines' ? [{words: [word]}, {words: []}] : [{words: [word]}];
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
				currentLine[actualLine].words.push(word);
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

export const SubtitlesSimple = ({ subtitleSequences }: { subtitleSequences: any }) => {
	const subtitles = useMemo(() => {
        const sub = formatSubtitles(subtitleSequences, 'line', 400, 50, "Helvetica, sans-serif");
        console.log('subtitles', sub)
		return sub;
	}, [subtitleSequences]);

    let currentFrame = 0;
    
	return (
		<>
			{subtitles.map((subtitle, index) => {
				if (subtitle.durationInFrames === 0) {
					subtitle.durationInFrames = 1;
				}
				const element = (
					<Sequence key={index} from={currentFrame} durationInFrames={subtitle.durationInFrames}>
						<SubtitleSimple subtitleSequence={subtitle} start={currentFrame}/>
					</Sequence>
				);
				currentFrame += subtitle.durationInFrames;
				return element;
			})}
		</>
	);
};