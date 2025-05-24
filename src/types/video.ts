import { AvatarLook } from "./avatar";

export interface IWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
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
  position?: {
    x: number;
    y: number;
  };
  video?: {
    id: string;
    quality?: string;
    file_type: string;
    size: number;
    width?: number;
    height?: number;
    fps?: number;
    link: string;
    frames?: string[];
    durationInSeconds?: number;
  };
  video_pictures?: any[];
  image?: {
    id: string;
    link: string;
    width?: number;
    height?: number;
    size?: number;
  };
  audio?: {
    id: string;
    link: string;
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
  audioIndex: number;
  media?: IMedia;
  originalText?: string;
  needsAudioRegeneration?: boolean;
}
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
  mode?: string;
}

export interface IVideo {
  id?: string;
  spaceId: string; // MongoDB ObjectId as string
  costToGenerate?: number;
  archived?: boolean;
  state: {
    type: 'pending' | 'generating' | 'done' | 'exporting' | 'error';
    message?: string;
  };
  title?: string;
  style?: string;
  isNews?: boolean;
  runId: string;
  settings?: {
    avatarHeightRatio?: number;
  };
  video?: {
    thumbnail: string;
    subtitle: any;
    keywords?: string[];
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
      language: string;
    };
    sequences: ISequence[];
    transitions?: ITransition[];
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
