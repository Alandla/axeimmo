import { KlingGenerationMode } from "./fal";
import { generateAvatarRenderList } from './avatar-render';
import { IVideo } from "../types/video";

interface TokenUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

export const KLING_GENERATION_COSTS = {
  [KlingGenerationMode.STANDARD]: 5,
  [KlingGenerationMode.PRO]: 7
} as const;

export const KLING_GENERATION_COSTS_GENERATE = {
  [KlingGenerationMode.STANDARD]: 0.35,
  [KlingGenerationMode.PRO]: 0.45
} as const;

export function calculateAnthropicCost(usage: TokenUsage): number {
  const INPUT_COST_PER_TOKEN = 0.000003;  // $3 par million de tokens pour claude 3.5 sonnet
  const OUTPUT_COST_PER_TOKEN = 0.000015;  // $15 par million de tokens pour claude 3.5 sonnet

  const inputCost = usage.promptTokens * INPUT_COST_PER_TOKEN;
  const outputCost = usage.completionTokens * OUTPUT_COST_PER_TOKEN;

  return inputCost + outputCost;
}

export function calculateElevenLabsCost(text: string, isTurbo: boolean = false): number {
  const COST_PER_1000_CHARS = 0.24;
  const TURBO_DISCOUNT = 0.5;

  // Calculer le coût de base pour 1000 caractères
  const baseRate = isTurbo ? COST_PER_1000_CHARS * TURBO_DISCOUNT : COST_PER_1000_CHARS;
  
  // Calculer le coût pour la longueur réelle du texte
  return (text.length / 1000) * baseRate;
}

export function calculateMinimaxCost(text: string): number {
  const COST_PER_1000_CHARS = 0.06;
  
  // Calculer le coût pour la longueur réelle du texte
  return (text.length / 1000) * COST_PER_1000_CHARS;
}

export function calculateHeygenCost(durationInSeconds: number, model: 'heygen' | 'heygen-iv' = 'heygen'): number {
  if (model === 'heygen-iv') {
    // Avatar IV: $0.025 per second
    const COST_PER_SECOND = 0.025;
    return durationInSeconds * COST_PER_SECOND;
  } else {
    // Original model: $0.25 per 30 seconds segment
    const COST_PER_30_SECONDS = 0.25;
    const segments = Math.ceil(durationInSeconds / 30);
    return segments * COST_PER_30_SECONDS;
  }
}

export function calculateOmniHumanCost(durationInSeconds: number): number {
  const COST_PER_SECOND = 0.16;
  return durationInSeconds * COST_PER_SECOND;
}

export function calculateWhisperGroqCost(durationInSeconds: number, isTurbo: boolean = false): number {
  // Convertir les secondes en heures
  const durationInHours = durationInSeconds / 3600;
  
  // Prix par heure transcrite
  const WHISPER_LARGE_COST_PER_HOUR = 0.111;
  const WHISPER_LARGE_TURBO_COST_PER_HOUR = 0.04;
  
  // Calculer le coût en fonction du modèle
  return durationInHours * (isTurbo ? WHISPER_LARGE_TURBO_COST_PER_HOUR : WHISPER_LARGE_COST_PER_HOUR);
}

export function calculateWhisperSieveCost(durationInSeconds: number): number {
  // Convertir les secondes en heures
  const durationInHours = durationInSeconds / 3600;
  
  // Prix par heure transcrite
  const SIEVE_COST_PER_HOUR = 0.15;
  
  return durationInHours * SIEVE_COST_PER_HOUR;
}

export function calculateUpscaleCost(upscaleCount: number): number {
  const COST_PER_UPSCALE = 0.004;
  
  return upscaleCount * COST_PER_UPSCALE;
}

export function calculateKlingAnimationCost(mode: KlingGenerationMode, upscaleCount: number = 0): number {
  const animationCost = KLING_GENERATION_COSTS_GENERATE[mode];
  const upscaleCost = calculateUpscaleCost(upscaleCount);
  
  return animationCost + upscaleCost;
}

// Avatar model credit rates (credits per second)
export const AVATAR_MODEL_CREDIT_RATES = {
  'heygen': 0,
  'heygen-iv': 0.5,
  'omnihuman': 2.3,
  'veo-3-fast': 2.3,
  'veo-3': 5
} as const;

// Calcule le coût avatar en crédits pour l'utilisateur (avec marge)
export function calculateAvatarCreditsForUser(
  durationInSeconds: number, 
  model: 'heygen' | 'heygen-iv' | 'omnihuman' | 'veo-3' | 'veo-3-fast'
): number {
  return durationInSeconds * AVATAR_MODEL_CREDIT_RATES[model];
}

// Calcule la durée totale où l'avatar est visible
export function calculateTotalAvatarDuration(video: IVideo): number {
  const avatarRenders = generateAvatarRenderList(video); 
  console.log('video', video?.video?.audio?.voices);
  console.log('sequences', video?.video?.sequences);
  console.log('avatarRenders', avatarRenders);
  return avatarRenders.reduce((sum: number, render: any) => sum + render.durationInSeconds, 0);
}

// Calculate the number of unique veo3 videos needed based on unique audioIndex
export function calculateVeo3VideoCount(video: IVideo): number {
  if (!video.video?.sequences) {
    return 0;
  }
  
  const uniqueAudioIndexes = new Set<number>();
  for (const sequence of video.video.sequences) {
    uniqueAudioIndexes.add(sequence.audioIndex);
  }
  
  return uniqueAudioIndexes.size;
}

// Calculate veo3 avatar duration for billing
// Each video is billed at 8 seconds
export function calculateVeo3Duration(video: IVideo): number {
  const videoCount = calculateVeo3VideoCount(video);
  return videoCount * 8;
}

// Vérifie si la vidéo a une résolution supérieure à 1080p
export function isHighResolution(width: number, height: number): boolean {
  return width > 1920 || height > 1080;
}

// Calcule le coût supplémentaire pour les vidéos en haute résolution (> 1080p)
// Coût: 2.5 crédits par 30 secondes de vidéo avec buffer de 10 secondes
// Note: Ne s'applique que pour les formats custom
export function calculateHighResolutionCostCredits(
  durationInSeconds: number,
  width: number,
  height: number
): number {
  if (!isHighResolution(width, height)) {
    return 0;
  }
  
  const COST_PER_30_SECONDS = 2.5;
  // Round up to the nearest 10 seconds
  const roundedDuration = Math.ceil(durationInSeconds / 10) * 10;
  // Calculate segments with 10s buffer
  const segments = Math.max(1, Math.ceil((roundedDuration - 10) / 30));
  return segments * COST_PER_30_SECONDS;
}

// Veo3 cost per video (real cost for our stats, not user credits)
export const VEO3_GENERATION_COSTS = {
  'veo-3-fast': 1.2,
  'veo-3': 3.2
} as const;

// Calculate Veo3 avatar generation cost (real cost)
export function calculateVeo3Cost(
  videoCount: number,
  model: 'veo-3' | 'veo-3-fast'
): number {
  return videoCount * VEO3_GENERATION_COSTS[model];
}


