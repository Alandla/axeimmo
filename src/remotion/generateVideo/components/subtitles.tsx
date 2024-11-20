import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame } from "remotion";
import {fillTextBox} from '@remotion/layout-utils';
import {useMemo} from 'react';
import { Subtitle } from "./subtitle";

export type Word = {
	word: string;
	start: number;
	end: number;
	confidence: number;
	durationInFrames: number;
	startInFrames: number;
};

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
		words: Word[];
		start: number;
		end: number;
		text: string;
		durationInFrames: number;
	}[] = [];

	let startInFrame = 0

	sequences.forEach((sequence) => {
		if (mode === 'word') {
			// Un sous-titre par mot
			sequence.words.forEach((word) => {
				subtitles.push({
					words: [word],
					start: word.start,
					end: word.end,
					text: word.word,
					durationInFrames: word.durationInFrames,
				});
			});
		} else {
			// Initialiser le textBox avec la configuration souhaitée
			let box = fillTextBox({
				maxBoxWidth: maxWidth,
				maxLines: mode === 'twoLines' ? 2 : 1,
			});

			let currentLine: Word[] = [];
            let durationInFrames = 0;

			// Parcourir les mots de la séquence
			sequence.words.forEach((word, index) => {
				const result = box.add({
					text: word.word,
					fontFamily,
					fontSize,
				});
				
				console.log('result', result)

				if (result.exceedsBox) {
					// Si le mot dépasse ou nécessite une nouvelle ligne, 
					// on crée un nouveau sous-titre avec les mots accumulés
					if (currentLine.length > 0) {
						subtitles.push({
							words: [...currentLine],
							start: currentLine[0].start,
							end: currentLine[currentLine.length - 1].end,
							text: currentLine.map(w => w.word).join(' '),
							durationInFrames,
						});
					}
					// Réinitialiser pour la nouvelle ligne
                    durationInFrames = word.durationInFrames
					currentLine = [word];
					box = fillTextBox({
						maxBoxWidth: maxWidth,
						maxLines: mode === 'twoLines' ? 2 : 1,
					});
				} else {
					// Ajouter le mot à la ligne courante
                    durationInFrames += word.durationInFrames;
					word.startInFrames = startInFrame
					startInFrame += word.durationInFrames
					currentLine.push(word);
				}

				// Gérer le dernier mot de la séquence
				if (index === sequence.words.length - 1 && currentLine.length > 0) {
					console.log('word', word.word)
					console.log('currentLine', currentLine)
					subtitles.push({
						words: [...currentLine],
						start: currentLine[0].start,
						end: word.end,
						text: currentLine.map(w => w.word).join(' '),
						durationInFrames,
					});
				}
			});
		}
	});

	return subtitles;
};

export const Subtitles = ({ subtitleSequences }: { subtitleSequences: any }) => {
	const subtitles = useMemo(() => {
        const sub = formatSubtitles(subtitleSequences, 'twoLines', 600, 50, "Helvetica, sans-serif");
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
						<Subtitle subtitleSequence={subtitle} start={currentFrame}/>
					</Sequence>
				);
				currentFrame += subtitle.durationInFrames;
				return element;
			})}
		</>
	);
};