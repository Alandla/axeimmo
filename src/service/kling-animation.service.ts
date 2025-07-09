import { generateKlingAnimationPrompt } from "@/src/lib/workflowai";
import { startKlingVideoGeneration, KlingGenerationMode } from "@/src/lib/fal";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";

interface KlingAnimationParams {
  prompt: string;
  image_url: string;
  duration: string;
  aspect_ratio: string;
}

interface KlingAnimationResult {
  request_id: string;
  usedR2Url?: string; // URL R2 utilisée si upload nécessaire
}

interface GenerateKlingAnimationOptions {
  imageUrl: string;
  context: string;
  imageWidth?: number;
  imageHeight?: number;
  duration?: "5" | "10";
  mode: KlingGenerationMode;
}

/**
 * Génère une animation Kling avec retry automatique et upload R2 si nécessaire
 * @param options - Options pour la génération d'animation
 * @returns Résultat de la génération avec request_id et URL R2 utilisée si applicable
 */
export async function generateKlingAnimation(
  options: GenerateKlingAnimationOptions
): Promise<KlingAnimationResult> {
  const { imageUrl, context, imageWidth = 1920, imageHeight = 1080, duration = "5", mode } = options;
  
  let finalImageUrl = imageUrl;
  let usedR2Url: string | undefined;

  // Étape 1: Générer le prompt d'animation avec retry
  let promptResult;
  
  try {
    // Premier essai avec l'URL originale
    promptResult = await generateKlingAnimationPrompt(imageUrl, context);
  } catch (error) {
    console.error("Error generating animation prompt with original URL, uploading to R2 and retrying:", error);
    
    try {
      // Upload image to R2 and retry
      const fileName = `image-${Date.now()}`;
      const r2Url = await uploadImageFromUrlToS3(imageUrl, "medias-users", fileName);
      
      promptResult = await generateKlingAnimationPrompt(r2Url, context);
      finalImageUrl = r2Url; // Utiliser l'URL R2 pour la génération Kling
      usedR2Url = r2Url;
    } catch (retryError) {
      console.error("Error generating animation prompt even after uploading to R2:", retryError);
      throw retryError;
    }
  }

  // Étape 2: Calculer le ratio d'aspect
  const aspectRatio = imageWidth >= imageHeight ? "16:9" : "9:16";
  
  // Étape 3: Démarrer la génération vidéo avec Kling
  const falResult = await startKlingVideoGeneration({
    prompt: promptResult.enhancedPrompt,
    image_url: finalImageUrl, // Utiliser l'URL finale (originale ou R2)
    duration,
    aspect_ratio: aspectRatio
  }, mode);

  return {
    request_id: falResult.request_id,
  };
} 