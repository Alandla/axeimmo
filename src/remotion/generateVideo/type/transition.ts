type MixBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface ITransition {
	indexSequenceBefore?: number;
	video: string;
	thumbnail: string;
	sound?: string;
	volume?: number;
	soundPeakAt?: number;
	fullAt?: number;
	durationInFrames?: number;
	category?: string;
	mode?: MixBlendMode;
  }
  