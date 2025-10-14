import { AvatarLook } from "./avatar";
import { KlingGenerationMode } from "@/src/lib/fal";

export type GenerationStatus = 
  | 'pending' 
  | 'generating-video' 
  | 'generating-image' 
  | 'completed' 
  | 'failed';

export type ZoomType = 
  | 'zoom-in' | 'zoom-in-fast' | 'zoom-in-impact' | 'zoom-in-instant'
  | 'zoom-out' | 'zoom-out-fast' | 'zoom-out-impact' | 'zoom-out-instant'
  | 'zoom-in-continuous' | 'zoom-out-continuous';

export interface IWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  durationInFrames: number;
  zoom?: ZoomType;
}

export interface IMedia {
  id?: string;
  type: 'image' | 'video' | 'audio';
  usage: 'voice' | 'avatar' | 'media' | 'element';
  show?: 'full' | 'half' | 'hide';
  startAt?: number;
  name: string;
  source?: string;
  generationStatus?: GenerationStatus;
  requestId?: string;
  generationMode?: KlingGenerationMode;
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

export interface IElement {
  media: IMedia;
  position: { x: number; y: number };
  start: number;
  end: number;
  durationInFrames: number;
  size: number;
  rotation?: number;
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
  extractedMedia?: IMedia[];
  video?: {
    thumbnail: string;
    subtitle: any;
    keywords?: string[];
    format?: VideoFormat;
    width?: number;
    height?: number;
    audio?: {
      voices: {
        url: string;
        voiceId?: string;
        index: number;
        startOffset?: number;
        start: number;
        end: number;
        durationInFrames: number;
        emotionEnhancement?: boolean;
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
    elements?: IElement[];
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

export type VideoFormat = 'vertical' | 'ads' | 'square' | 'horizontal' | 'custom';

export interface VideoFormatOption {
  value: VideoFormat;
  ratio: string;
  width: number;
  height: number;
}

export const VIDEO_FORMATS: VideoFormatOption[] = [
  { value: 'vertical', ratio: '9:16', width: 1080, height: 1920 },
  { value: 'ads', ratio: '4:5', width: 1080, height: 1350 },
  { value: 'square', ratio: '1:1', width: 1080, height: 1080 },
  { value: 'horizontal', ratio: '16:9', width: 1920, height: 1080 },
  { value: 'custom', ratio: 'Custom', width: 1080, height: 1920 }
];

export const getVideoDimensions = (format: VideoFormat = 'vertical', customWidth?: number, customHeight?: number): { width: number; height: number } => {
  if (format === 'custom' && customWidth && customHeight) {
    return { width: customWidth, height: customHeight };
  }
  const formatConfig = VIDEO_FORMATS.find(f => f.value === format);
  return formatConfig ? { width: formatConfig.width, height: formatConfig.height } : { width: 1080, height: 1920 };
};
