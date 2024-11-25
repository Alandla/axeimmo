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

export type Sequence = {
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

export type SubtitleMode = 'word' | 'line' | 'twoLines';