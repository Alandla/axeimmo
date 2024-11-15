export interface IWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  durationInFrames: number;
}

export interface IMedia {
  type: 'image' | 'video';
  show: 'full' | 'middle' | 'hide';
  name: string;
  height: number;
  width: number;
  video?: {
    id: string;
    quality: string;
    file_type: string;
    size: number;
    width: number;
    height: number;
    fps: number;
    link: string;
  };
  image?: {
    id: string;
    link: string;
    width: number;
    height: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISequence {
  words: IWord[];
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
  media?: IMedia;
}

export interface IVideo {
  space: string; // MongoDB ObjectId as string
  costToGenerate: number;
  video: {
    audioUrl: string;
    thumbnail: string;
    metadata: {
      audio_duration: number;
      number_of_distinct_channels: number;
      billing_time: number;
      transcription_time: number;
    };
    sequences: ISequence[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}
