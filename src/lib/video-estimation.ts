import { KLING_GENERATION_COSTS } from "./cost";
import { KlingGenerationMode } from "./fal";

/**
 * Calcule la durée en secondes d'un script basé sur le nombre de caractères
 * Utilise le ratio de 936 caractères par minute, avec le même calcul que l'ancienne méthode
 */
export const calculateScriptDurationInSeconds = (script: string): number => {
  const characters = script.length;
  const minutes = Math.floor(characters / 936);
  const remainingSeconds = Math.round((characters % 936) / 936 * 60);
  return minutes * 60 + remainingSeconds;
};

/**
 * Formate une durée en secondes au format MM:SS
 */
export const formatDuration = (durationInSeconds: number): string => {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.round(durationInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
  duration?: number;
}): number => {
  let credits = 0;
  
  // Coût de génération basé sur la durée fournie ou estimée du script
  let estimatedDurationSeconds: number;
  
  if (options.duration) {
    // Utiliser la durée fournie directement
    estimatedDurationSeconds = options.duration;
  } else {
    // Utiliser la méthode calculateScriptDurationInSeconds pour estimer la durée
    estimatedDurationSeconds = calculateScriptDurationInSeconds(options.script);
  }
  
  credits += calculateGenerationCredits(estimatedDurationSeconds);
  
  // Coût animation d'images
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
 * Calcule le coût de génération d'une vidéo basé sur la durée (migré depuis page.tsx)
 */
export const calculateGenerationCredits = (videoDurationInSeconds: number): number => {
  // Round up to the nearest 15 seconds
  const roundedDuration = Math.ceil(videoDurationInSeconds / 15) * 15;
  
  // Calculate the number of credits based on the rounded duration
  const creditsNeeded = Math.max(0.5, Math.ceil((roundedDuration - 15) / 30) * 0.5);
  
  return creditsNeeded * 10;
};

/**
 * Calcule la machine Trigger.dev nécessaire selon la taille des vidéos
 * @param videoFiles - Liste des fichiers vidéo avec leurs métadonnées
 * @param thresholdInMB - Seuil en MB pour passer à medium-2x (défaut: 100 MB)
 * @returns Le preset de machine à utiliser
 */
export const calculateRequiredMachine = (
  videoFiles: { video?: { size?: number } }[],
  thresholdInMB: number = 100
): "medium-2x" | "medium-1x" => {
  const totalVideoSize = videoFiles.reduce(
    (sum, file) => sum + (file.video?.size || 0), 
    0
  );
  const totalVideoSizeInMB = totalVideoSize / 1024 / 1024;
  
  return totalVideoSizeInMB > thresholdInMB ? "medium-2x" : "medium-1x";
};