import { Sequence, useVideoConfig } from "remotion";
import {useMemo} from 'react';
import { Line, Sequence as SequenceType, SubtitleMode, Word } from "../../type/subtitle";
import { fillTextBox } from "../../utils/measureText";
import { SubtitleModern } from "./subtitleModern";
import { fitText, measureText } from "@remotion/layout-utils";

export const formatSubtitles = (
	sequences: SequenceType[],
	maxWidth: number,
	style?: { isPunctuation?: boolean; isUppercase?: boolean, fontSize?: number, fontFamily?: string, fontWeight?: number, mode?: SubtitleMode, secondLine?: { dynamicSize?: boolean } }
) => {
	const subtitles: {
		lines: Line[];
		start: number;
		end: number;
		text: string;
		durationInFrames: number;
	}[] = [];

	let startInFrame = 0;
	let mode = style?.mode || 'twoLines';

	if (mode === 'word') {
		// Traiter chaque séquence
		sequences.forEach((sequence) => {
			sequence.words.forEach((word) => {
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
		});
	} else {
		// Traiter chaque séquence
		sequences.forEach((sequence) => {
			let box = fillTextBox({
				maxBoxWidth: maxWidth,
				maxLines: mode === 'twoLines' ? 2 : 1,
			});

			let currentLine: Line[] = mode === 'twoLines' ? [{words: []}, {words: []}] : [{words: []}];
			let durationInFrames = 0;
			let actualLine = 0;
			let text = '';

			// Une fois qu'on a rempli les deux lignes, on ajuste la taille
			const adjustSecondLineSize = (lines: Line[]) => {
				if (lines[0].words.length === 0 || lines[1].words.length === 0) return;

				// Mesure la largeur de la première ligne
				const line1Width = measureText({
					text: lines[0].words.map(w => w.word).join(' '),
					fontFamily: style?.fontFamily || 'Montserrat',
					fontSize: style?.fontSize || 70,
					fontWeight: style?.fontWeight || 700,
				}).width;

				// Mesure la largeur de la deuxième ligne avec la taille initiale
				const line2Text = lines[1].words.map(w => w.word).join(' ');
				const line2Width = measureText({
					text: line2Text,
					fontFamily: style?.fontFamily || 'Montserrat',
					fontSize: style?.fontSize || 70,
					fontWeight: style?.fontWeight || 700,
				}).width;

				// Si la première ligne est plus large, on ajuste la taille de la deuxième
				if (line1Width > line2Width) {
					const { fontSize: newFontSize } = fitText({
						text: line2Text,
						fontFamily: style?.fontFamily || 'Montserrat',
						fontWeight: style?.fontWeight || 700,
						withinWidth: line1Width,
					});

					const maxAllowedSize = (style?.fontSize || 70) * 2 || 140; // 300% de 70px par défaut
					const finalFontSize = Math.min(newFontSize, maxAllowedSize);

					// On applique la nouvelle taille à tous les mots de la deuxième ligne
					lines[1].words.forEach(word => {
						word.fontSize = finalFontSize;
					});

					// On applique la nouvelle taille à tous les mots de la deuxième ligne
					lines[1].words.forEach(word => {
						word.fontSize = newFontSize;
					});
				}
			};

			sequence.words.forEach((word, index, words) => {
				const processedWord = style?.isPunctuation 
						? word.word.replace(/[.,;!?]/g, '')
						: word.word;

				const result = box.add({
					text: processedWord,
					fontFamily: `${style?.fontFamily || 'Montserrat'}, sans-serif`,
					fontWeight: style?.fontWeight || 700,
					fontSize: (style?.fontSize || 70) + 10,
					textTransform: style?.isUppercase ? 'uppercase' : 'none',
				});

				if (result.newLine && mode === 'twoLines' && actualLine < 1 && text.length > 0) {
					actualLine++;
				}

				if (result.exceedsBox) {
					if (currentLine[0].words.length > 0) {
						if (style?.secondLine?.dynamicSize) {
						  adjustSecondLineSize(currentLine);
						}
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

				if (result.newLine && mode === 'twoLines' && actualLine < 1 && !(text.length > 0)) {
					actualLine++;
				}

				if (index === words.length - 1 && currentLine.length > 0) {
					if (style?.secondLine?.dynamicSize) {
					  adjustSecondLineSize(currentLine);
					}
					subtitles.push({
						lines: [...currentLine],
						start: currentLine[0].words[0].start,
						end: word.end,
						text: text,
						durationInFrames,
					});
				}
			});
		});
	}

	return subtitles;
};

export const SubtitlesModern = ({ subtitleSequences, style }: { subtitleSequences: any, style: any }) => {
	const { width } = useVideoConfig();
	
	const subtitles = useMemo(() => {
        const sub = formatSubtitles(
			subtitleSequences, 
			width*0.3, 
			style
		);
		return sub;
	}, [subtitleSequences, style]);

    let currentFrame = 0;
    
	return (
		<>
			{subtitles.map((subtitle, index) => {
				if (subtitle.durationInFrames === 0) {
					subtitle.durationInFrames = 1;
				}
				const element = (
					<Sequence key={index} from={currentFrame} durationInFrames={subtitle.durationInFrames}>
						<SubtitleModern subtitleSequence={subtitle} start={currentFrame} style={style} />
					</Sequence>
				);
				currentFrame += subtitle.durationInFrames;
				return element;
			})}
		</>
	);
};