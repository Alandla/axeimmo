import { generateKlingAnimationPrompt } from "@/src/lib/workflowai";
import { startKlingVideoGeneration, KlingGenerationMode, upscaleImage } from "@/src/lib/fal";
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
  upscale?: boolean;
}

/**
 * Génère une animation Kling avec retry automatique et upload R2 si nécessaire
 * @param options - Options pour la génération d'animation
 * @returns Résultat de la génération avec request_id et URL R2 utilisée si applicable
 */
export async function generateKlingAnimation(
  options: GenerateKlingAnimationOptions
): Promise<KlingAnimationResult> {
  const { imageUrl, context, imageWidth = 1920, imageHeight = 1080, duration = "5", mode, upscale = false } = options;
  
  let finalImageUrl = imageUrl;
  let usedR2Url: string | undefined;

  // Étape 0: Upscale si nécessaire
  if (upscale && (imageWidth < 1080 || imageHeight < 1080)) {
    try {
      console.log("Upscaling image before animation generation...");
      const upscaled = await upscaleImage(imageUrl);
      finalImageUrl = upscaled.url;
      console.log("Image upscaled successfully");
    } catch (upscaleError) {
      console.error("Error upscaling image, uploading to R2 and retrying upscale:", upscaleError);
      
      try {
        // Si l'upscale échoue, on upload sur R2
        const fileName = `image-${Date.now()}`;
        const r2Url = await uploadImageFromUrlToS3(imageUrl, "medias-users", fileName);
        usedR2Url = r2Url;
        
        // Retry upscale with R2 URL
        try {
          console.log("Retrying upscale with R2 URL...");
          const upscaled = await upscaleImage(r2Url);
          finalImageUrl = upscaled.url;
          console.log("Image upscaled successfully with R2 URL");
        } catch (secondUpscaleError) {
          console.error("Error upscaling with R2 URL, using R2 URL directly:", secondUpscaleError);
          finalImageUrl = r2Url;
        }
      } catch (r2Error) {
        console.error("Error uploading to R2 after upscale failure:", r2Error);
        throw r2Error;
      }
    }
  }

  // Étape 1: Générer le prompt d'animation avec retry
  let promptResult;
  
  try {
    // Premier essai avec l'URL finale (upscalée ou originale)
    promptResult = await generateKlingAnimationPrompt(finalImageUrl, context);
  } catch (error) {
    console.error("Error generating animation prompt with final URL:", error);
    
    // Si on a déjà une URL R2, on ne retry pas
    if (usedR2Url) {
      console.error("Already used R2 URL, cannot retry further");
      throw error;
    }
    
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
    image_url: finalImageUrl, // Utiliser l'URL finale (upscalée, originale ou R2)
    duration,
    aspect_ratio: aspectRatio
  }, mode);

  return {
    request_id: falResult.request_id,
  };
} 