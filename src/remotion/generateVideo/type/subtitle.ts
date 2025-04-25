export type Word = {
	word: string;
	start: number;
	end: number;
	confidence: number;
	durationInFrames: number;
	startInFrames: number;
	fontSize?: number;
};

export type Line = {
	words: Word[];
}

export type Sequence = {
	words: Word[];
	text: string;
	start: number;
	end: number;
	durationInFrames?: number;
	audioUrl?: string;
};

export type SubtitleMode = 'word' | 'line' | 'twoLines';