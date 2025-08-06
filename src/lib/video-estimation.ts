import { KLING_GENERATION_COSTS } from "./cost";
import { KlingGenerationMode } from "./fal";

// Estime le nombre de séquences vidéo selon la longueur du script, à partir des statistiques :
// 15 s  → 6,23 séquences ≈ 271 caractères
// 30 s  → 11,48 séquences ≈ 516 caractères
// 60 s  → 21,81 séquences ≈ 979 caractères
export const estimateVideoSequences = (script: string): number => {
  const length = script.length;

  // Petits scripts (≤ 271 car.) – interpolation linéaire jusqu'à 6,23 séquences
  if (length <= 271) {
    return Math.max(1, Math.ceil((length / 271) * 6.23));
  }

  // Scripts moyens (272-516 car.) – interpolation linéaire jusqu'à 11,48 séquences
  if (length <= 516) {
    return Math.ceil(6.23 + ((length - 271) / (516 - 271)) * (11.48 - 6.23));
  }

  // Scripts longs (517-979 car.) – interpolation linéaire jusqu'à 21,81 séquences
  if (length <= 979) {
    return Math.ceil(11.48 + ((length - 516) / (979 - 516)) * (21.81 - 11.48));
  }

  // Au-delà de 979 caractères, on applique le ratio moyen ≈ 45 car./séquence
  const avgCharsPerSequence = 45;
  return Math.ceil(length / avgCharsPerSequence);
};

/**
 * Calcule le coût d'animation d'images pour une vidéo
 */
export const calculateAnimationCost = (
  extractedImagesCount: number,
  script: string,
  animationMode: KlingGenerationMode
): number => {
  const estimatedSequences = estimateVideoSequences(script);
  const maxImagesToAnimate = Math.min(extractedImagesCount, estimatedSequences);
  const costPerAnimation = KLING_GENERATION_COSTS[animationMode] ?? 0;
  
  return maxImagesToAnimate * costPerAnimation;
};

/**
 * Calcule le coût estimé total pour la génération d'une vidéo
 */
export const calculateEstimatedCredits = (options: {
  script: string;
  hasAvatar: boolean;
  animateImages: boolean;
  animationMode: KlingGenerationMode;
  extractedImagesCount?: number;
}): number => {
  // Seul coût pour la génération : l'animation d'images
  let credits = 0;
  
  // Coût animation d'images (principal coût)
  if (options.animateImages && options.extractedImagesCount) {
    credits += calculateAnimationCost(
      options.extractedImagesCount,
      options.script,
      options.animationMode
    );
  }
  
  return credits;
};

/**
 * Calcule le coût d'export d'une vidéo
 */
export const calculateExportCost = (videoDurationInSeconds: number): number => {
  // Round up to the nearest 15 seconds
  const roundedDuration = Math.ceil(videoDurationInSeconds / 15) * 15;
  
  // Calculate the number of credits based on the rounded duration
  const creditsNeeded = Math.max(0.5, Math.ceil((roundedDuration - 15) / 30) * 0.5);
  
  return creditsNeeded * 10;
};