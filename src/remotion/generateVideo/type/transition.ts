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
	mode: string;
}
  