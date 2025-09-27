import { generateKlingAnimationPrompt } from "@/src/lib/workflowai";
import { startKlingVideoGeneration, KlingGenerationMode, upscaleImage } from "@/src/lib/fal";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";
import { calculateKlingAnimationCost } from "@/src/lib/cost";
import { getImageFileSize } from "@/src/utils/image-resize";
import { optimizeImageForSize } from "@/src/utils/image-resize";
interface KlingAnimationResult {
  request_id: string;
  cost: number;
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
 * Vérifie la taille d'une image et la redimensionne si elle dépasse la limite Kling (10MB)
 * Teste progressivement les largeurs Vercel de la plus grande à la plus petite
 * @param imageUrl URL de l'image à vérifier
 * @param fileSize Taille du fichier en bytes (optionnel, sera détecté si non fourni)
 * @param originalWidth Largeur originale de l'image (optionnel)
 * @returns URL de l'image (redimensionnée si nécessaire)
 */
async function checkAndResizeImageIfNeeded(
  imageUrl: string, 
  fileSize?: number, 
  originalWidth?: number
): Promise<string> {
  const KLING_SIZE_LIMIT = 10485760; // 10MB
  
  // Si on n'a pas la taille, essayer de la détecter
  if (!fileSize) {
    console.log("File size not provided, trying to detect...");
    fileSize = await getImageFileSize(imageUrl);
    if (!fileSize) {
      console.log("Could not detect file size, proceeding with original image");
      return imageUrl;
    }
  }
  
  console.log(`Image size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
  
  if (fileSize <= KLING_SIZE_LIMIT) {
    console.log("Image size is within Kling API limits");
    return imageUrl;
  }
  
  console.log("Image too large for Kling API, trying progressive optimization with Vercel...");
  return await optimizeImageForSize(imageUrl, KLING_SIZE_LIMIT, originalWidth);
}


/**
 * Génère une animation Kling avec retry automatique et upload R2 si nécessaire
 * @param options - Options pour la génération d'animation
 * @returns Résultat de la génération avec request_id, coût total et URL R2 utilisée si applicable
 */
export async function generateKlingAnimation(
  options: GenerateKlingAnimationOptions
): Promise<KlingAnimationResult> {
  const { imageUrl, context, imageWidth = 1920, imageHeight = 1080, duration = "5", mode, upscale = false } = options;
  
  let finalImageUrl = imageUrl;
  let usedR2Url: string | undefined;
  let upscaleCount = 0;
  let finalImageFileSize: number | undefined;

  if (upscale && (imageWidth < 1080 || imageHeight < 1080)) {
    try {
      console.log("Upscaling image before animation generation...");
      const upscaled = await upscaleImage(imageUrl);
      finalImageUrl = upscaled.url;
      finalImageFileSize = upscaled.file_size;
      upscaleCount = 1;
      console.log("Image upscaled successfully");
    } catch (upscaleError) {
      console.error("Error upscaling image, uploading to R2 and retrying upscale:", upscaleError);
      
      try {
        const fileName = `image-${Date.now()}`;
        const r2Url = await uploadImageFromUrlToS3(imageUrl, "medias-users", fileName);
        usedR2Url = r2Url;
        
        // Retry upscale with R2 URL
        try {
          console.log("Retrying upscale with R2 URL...");
          const upscaled = await upscaleImage(r2Url);
          finalImageUrl = upscaled.url;
          finalImageFileSize = upscaled.file_size;
          upscaleCount = 1;
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

  // Étape 1: Calculer le ratio d'aspect
  const aspectRatio = imageWidth >= imageHeight ? "16:9" : "9:16";
  
  // Étape 2: Vérification proactive de la taille de l'image avant génération Kling
  console.log("Checking image size before Kling generation...");
  const checkedImageUrl = await checkAndResizeImageIfNeeded(
    finalImageUrl, 
    finalImageFileSize, 
    imageWidth // Pass original width for progressive optimization
  );
  
  // Si l'image a été optimisée avec Vercel, l'uploader sur R2 pour Kling
  if (checkedImageUrl !== finalImageUrl) {
    console.log("Image was optimized with Vercel before Kling generation", checkedImageUrl);
    
    try {
      // Upload l'image optimisée sur R2
      console.log("Uploading optimized image to R2...");
      const fileName = `optimized-image-${Date.now()}`;
      const r2Url = await uploadImageFromUrlToS3(checkedImageUrl, "medias-users", fileName);
      
      finalImageUrl = r2Url;
      usedR2Url = r2Url;
      console.log("Optimized image uploaded to R2:", r2Url);
    } catch (r2Error) {
      console.error("Error uploading optimized image to R2:", r2Error);
      // Continue avec l'URL Vercel si l'upload R2 échoue
      finalImageUrl = checkedImageUrl;
    }
  }

  // Étape 3: Générer le prompt d'animation avec retry
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
  
  // Étape 4: Démarrer la génération vidéo avec Kling
  const falResult = await startKlingVideoGeneration({
    prompt: promptResult.enhancedPrompt,
    image_url: finalImageUrl, // Utiliser l'URL finale (upscalée, originale ou R2)
    duration,
    aspect_ratio: aspectRatio
  }, mode);

  // Étape 5: Calculer le coût total
  const totalCost = calculateKlingAnimationCost(mode, upscaleCount);

  return {
    request_id: falResult.request_id,
    cost: totalCost
  };
} 