import { AvatarLook } from "./avatar";

export interface IWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  durationInFrames: number;
}

export interface IMedia {
  id?: string;
  type: 'image' | 'video' | 'audio';
  usage: 'voice' | 'avatar' | 'media';
  show?: 'full' | 'half' | 'hide';
  startAt?: number;
  name: string;
  description?: [
    {
      start: number;
      duration?: number;
      text: string;
    }
  ];
  video?: {
    id: string;
    quality?: string;
    file_type: string;
    size: number;
    width: number;
    height: number;
    fps?: number;
    link: string;
  };
  image?: {
    id: string;
    link: string;
    width: number;
    height: number;
  };
  audio?: {
    id: string;
    link: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IDefaultSequence {
  type?: 'default'; // optionnel, sera 'default' si non spécifié
  start: number;
  end: number;
  durationInFrames?: number;
  words: IWord[];
  text: string;
  audioIndex: number;
  keywords?: Array<{
    search: 'stock' | 'web';
    keyword: string;
    precision: 'hard' | 'normal' | 'easy';
  }>;
  media?: IMedia;
  originalText?: string;
  needsAudioRegeneration?: boolean;
}
export interface ITransitionSequence {
  type: 'transition';
  durationInFrames?: number;
  video: string;
  thumbnail: string;
  fullAt?: number;
}

export type ISequence = IDefaultSequence | ITransitionSequence;

export interface IVideo {
  id?: string;
  spaceId: string; // MongoDB ObjectId as string
  costToGenerate?: number;
  state: {
    type: 'pending' | 'generating' | 'done' | 'exporting' | 'error';
    message?: string;
  };
  title?: string;
  style?: string;
  isNews?: boolean;
  runId: string;
  video?: {
    thumbnail: string;
    subtitle: any;
    audio?: {
      voices: {
        url: string;
        voiceId?: string;
        index: number;
        startOffset?: number;
        start: number;
        end: number;
        durationInFrames: number;
      }[];
      volume: number;
      music?: {
        name: string;
        url: string;
        volume: number;
        genre: string;
      }
    }
    metadata: {
      audio_duration: number;
      number_of_distinct_channels: number;
      billing_time: number;
      transcription_time: number;
    };
    sequences: ISequence[];
    avatar?: AvatarLook
  };
  history?: {
    step: 'CREATE' | 'EDIT' | 'EXPORT';
    user: string;
    date: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}
