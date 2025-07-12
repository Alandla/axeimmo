import { KlingGenerationMode } from "./fal";

interface TokenUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

export const KLING_GENERATION_COSTS = {
  [KlingGenerationMode.STANDARD]: 4,
  [KlingGenerationMode.PRO]: 7,
  [KlingGenerationMode.MASTER]: 10
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

export function calculateHeygenCost(durationInSeconds: number): number {
  const COST_PER_30_SECONDS = 0.2475;
  
  // Arrondir au multiple de 30 secondes supérieur
  const segments = Math.ceil(durationInSeconds / 30);
  
  return segments * COST_PER_30_SECONDS;
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
  const animationCost = KLING_GENERATION_COSTS[mode];
  const upscaleCost = calculateUpscaleCost(upscaleCount);
  
  return animationCost + upscaleCost;
}

