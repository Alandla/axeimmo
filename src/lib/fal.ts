import { fal } from "@fal-ai/client";

// Configuration Fal.ai
fal.config({
  credentials: process.env.FAL_KEY
});

export enum KlingGenerationMode {
  STANDARD = 'standard',
  PRO = 'pro'
}

export const KLING_ENDPOINTS = {
  [KlingGenerationMode.STANDARD]: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  [KlingGenerationMode.PRO]: "fal-ai/kling-video/v2.1/pro/image-to-video"
} as const;

export interface KlingRequest {
  prompt: string;
  image_url: string;
  duration?: "5" | "10";
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  negative_prompt?: string;
  cfg_scale?: number;
}

export interface KlingResponse {
  video: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
  seed: number;
  has_nsfw_concepts: boolean;
  prompt: string;
}

export interface FalQueueStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  response_url?: string;
  queue_position?: number;
  logs?: Array<{
    message: string;
    level: string;
    timestamp: string;
  }>;
}

export interface FalQueueResult {
  data?: KlingResponse;
}

// Simple avatar image generation via Fal.ai (endpoint configurable)
export interface AvatarImageRequest {
  prompt: string;
  seed?: number;
}

export interface AvatarImageResponse {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

export async function generateAvatarImage(
  request: AvatarImageRequest
): Promise<AvatarImageResponse> {
  // Par défaut, utiliser l'endpoint fourni: comfy/Hoox/srpo, à voir selon le modèle qu'on utilisera finalement selon le rendu voulu (ugc, pro, podcast, etc...)
  const endpoint = "comfy/Hoox/srpo";

  try {
    const randomSeed = request.seed ?? Math.floor(Math.random() * 10001);
    const result = await fal.subscribe(endpoint, {
      input: {
        srpo_input: request.prompt,
        random_noise: randomSeed
      },
      logs: true
    });

    const data: any = (result as any).data;
    const outputs = data?.outputs || {};
    let url: string | undefined;
    let file_name: string | undefined;
    for (const key of Object.keys(outputs)) {
      const images = outputs[key]?.images;
      if (Array.isArray(images) && images.length > 0) {
        const img = images[0];
        url = img?.url;
        file_name = img?.filename;
        break;
      }
    }
    if (!url) throw new Error("No image URL found in Fal response");
    return { url, file_name };
  } catch (error) {
    console.error("Error generating avatar image:", error);
    throw error;
  }
}


/**
 * Démarre la génération vidéo avec Kling selon le mode spécifié
 */
export async function startKlingVideoGeneration(
  request: KlingRequest, 
  mode: KlingGenerationMode = KlingGenerationMode.STANDARD
): Promise<{ request_id: string }> {
  // En mode test, retourner un ID fixe sans appeler l'API
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TEST MODE] Simulating Kling video generation with mode: ${mode}`);
    return { request_id: 'a07e8111-d339-4b5c-8563-9887bb4bd146' };
  }
  
  try {
    const endpoint = KLING_ENDPOINTS[mode];
    
    const result = await fal.queue.submit(endpoint, {
      input: {
        prompt: request.prompt,
        image_url: request.image_url,
        duration: request.duration || "5",
        aspect_ratio: request.aspect_ratio || "16:9",
        negative_prompt: request.negative_prompt || "cartoony motion, blurry motion, jitter, unbalanced movement, flickering limbs, expression lag, slow motion, repetitive loops, asynchronous facial movement, jerky transitions, camera drift or detachment, style inconsistency, unrealistic acting, off-sync reactions between characters",
        cfg_scale: request.cfg_scale || 0.5
      }
    });

    console.log(`Kling video generation started with mode: ${mode}, request_id: ${result.request_id}`);
    return { request_id: result.request_id };
  } catch (error) {
    console.error(`Error starting Kling video generation (${mode}):`, error);
    throw error;
  }
}

/**
 * Vérifie le statut d'une requête Fal
 */
export async function checkKlingRequestStatus(
  requestId: string,
  mode: KlingGenerationMode = KlingGenerationMode.STANDARD
): Promise<FalQueueStatus> {
  // En mode test, simuler une réponse basée sur l'ID de requête
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TEST MODE] Checking status for request ID: ${requestId}`);
    
    // Simuler différents états basés sur le temps écoulé
    const testId = 'a07e8111-d339-4b5c-8563-9887bb4bd146';
    if (requestId !== testId) {
      return { status: "IN_QUEUE", queue_position: 5 };
    }
    
    // Vérifier le temps écoulé depuis le démarrage de l'application
    const now = Date.now();
    
    // Utiliser une variable globale pour stocker le temps de démarrage
    // Déclarer l'interface pour éviter les erreurs TypeScript
    interface GlobalWithAppTime {
      __appStartTime?: number;
    }
    const globalWithTime = global as unknown as GlobalWithAppTime;
    const appStartTime = globalWithTime.__appStartTime || (globalWithTime.__appStartTime = now);
    
    const elapsedSeconds = Math.floor((now - appStartTime) / 1000);
    
    if (elapsedSeconds < 10) {
      // Pendant les 10 premières secondes, en file d'attente
      return { 
        status: "IN_QUEUE", 
        queue_position: Math.max(1, 5 - Math.floor(elapsedSeconds / 2)) 
      };
    } else if (elapsedSeconds < 20) {
      // Entre 10 et 20 secondes, en cours
      return { 
        status: "IN_PROGRESS",
        logs: [{ 
          message: `Processing video generation (${Math.floor((elapsedSeconds - 10) / 10 * 100)}%)`, 
          level: "info", 
          timestamp: new Date().toISOString() 
        }]
      };
    } else {
      // Après 20 secondes, terminé
      return { 
        status: "COMPLETED",
        response_url: "https://example.com/completed" 
      };
    }
  }

  try {
    const endpoint = KLING_ENDPOINTS[mode];

    const status = await fal.queue.status(endpoint, {
      requestId: requestId,
      logs: true,
    });

    return {
      status: status.status as "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED",
      response_url: status.response_url,
      queue_position: (status as any).queue_position,
      logs: (status as any).logs
    };
  } catch (error) {
    console.error('Error checking Kling request status:', error);
    throw error;
  }
}

/**
 * Récupère le résultat d'une requête Fal terminée
 */
export async function getKlingRequestResult(
  requestId: string,
  mode: KlingGenerationMode = KlingGenerationMode.STANDARD
): Promise<FalQueueResult> {

  try {
    const endpoint = KLING_ENDPOINTS[mode];

    const result = await fal.queue.result(endpoint, {
      requestId: requestId
    });

    return {
      data: result.data as KlingResponse
    };
  } catch (error) {
    console.error('Error getting Kling request result:', error);
    throw error;
  }
} 

/**
 * Upscale an image to 1080p using fal-ai/recraft/upscale/crisp
 * @param imageUrl URL of the image to upscale (must be PNG)
 * @returns { url: string, content_type: string, file_name: string, file_size: number }
 */
export async function upscaleImage(
  imageUrl: string
): Promise<{ url: string; content_type: string; file_name: string; file_size: number }> {
  try {
    const result = await fal.subscribe("fal-ai/recraft/upscale/crisp", {
      input: {
        image_url: imageUrl,
        enable_safety_checker: false
      },
      logs: false
    });
    const image = result.data?.image;
    if (!image?.url) throw new Error("No upscaled image returned");
    return {
      url: image.url,
      content_type: image.content_type!,
      file_name: image.file_name!,
      file_size: image.file_size!
    };
  } catch (error) {
    console.error("Error upscaling image:", error);
    throw error;
  }
} 