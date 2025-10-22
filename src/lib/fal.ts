import { fal } from "@fal-ai/client";
import { AVATAR_STYLES, type AvatarStyleKey } from '@/src/config/avatarStyles.config';

// Fal.ai client configuration
fal.config({
  credentials: process.env.FAL_KEY
});

export enum KlingGenerationMode {
  STANDARD = 'standard',
  PRO = 'pro'
}

// Centralized endpoints
export const KLING_ENDPOINTS = {
  [KlingGenerationMode.STANDARD]: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  [KlingGenerationMode.PRO]: "fal-ai/kling-video/v2.1/pro/image-to-video"
} as const;

const AVATAR_IMAGE_ENDPOINTS = {
  EDIT: "fal-ai/reve/remix",
  UPSCALE_CRISP: "fal-ai/recraft/upscale/crisp"
} as const;

export enum Veo3GenerationMode {
  STANDARD = 'standard',
  FAST = 'fast'
}

export const VEO3_ENDPOINTS = {
  [Veo3GenerationMode.STANDARD]: "fal-ai/veo3.1/image-to-video",
  [Veo3GenerationMode.FAST]: "fal-ai/veo3.1/fast/image-to-video"
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

export interface Veo3Request {
  prompt: string;
  image_url: string;
  duration?: "8s";
  aspect_ratio?: "9:16" | "16:9";
  generate_audio?: boolean;
  resolution?: "720p" | "1080p";
}

export interface Veo3Response {
  video: {
    url: string;
  };
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
}

export interface AvatarImageResponse {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

// Image editing via Fal.ai reve/remix
export interface EditImageRequest {
  prompt: string;
  image_urls: string[]; // 1-4 images required
  aspect_ratio?: "16:9" | "9:16" | "3:2" | "2:3" | "4:3" | "3:4" | "1:1";
  num_images?: number;
  output_format?: "png" | "jpeg" | "webp";
}

export interface EditImageResponse {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

function extractImageFromFalData(data: any): EditImageResponse | undefined {
  if (!data) return undefined;
  // Common structures across Fal endpoints
  if (data.image?.url) {
    const img = data.image;
    return {
      url: img.url,
      content_type: img.content_type,
      file_name: img.file_name,
      file_size: img.file_size,
      width: img.width,
      height: img.height
    };
  }
  if (Array.isArray(data.images) && data.images[0]?.url) {
    const img = data.images[0];
    return {
      url: img.url,
      content_type: img.content_type,
      file_name: img.file_name,
      file_size: img.file_size,
      width: img.width,
      height: img.height
    };
  }
  if (data.outputs) {
    for (const key of Object.keys(data.outputs)) {
      const images = data.outputs[key]?.images;
      if (Array.isArray(images) && images.length > 0 && images[0]?.url) {
        const img = images[0];
        return {
          url: img.url,
          file_name: img.filename
        } as EditImageResponse;
      }
    }
  }
  return undefined;
}

export async function editAvatarImage(
  request: EditImageRequest
): Promise<EditImageResponse> {
  const endpoint = AVATAR_IMAGE_ENDPOINTS.EDIT;
  try {
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt: request.prompt,
        image_urls: request.image_urls,
        ...(request.aspect_ratio ? { aspect_ratio: request.aspect_ratio } : {}),
        num_images: request.num_images || 1,
        ...(request.output_format ? { output_format: request.output_format } : {})
      },
      logs: true
    });

    console.log("Reve Remix result:", result);

    const data: any = (result as any).data;
    const image = extractImageFromFalData(data);
    if (!image?.url) throw new Error("No image URL found in Fal response");
    return image;
  } catch (error) {
    console.error("Error editing avatar image with Reve Remix:", error);
    throw error;
  }
}

// Generic Comfy SRPO generation function
async function generateAvatarImageComfyGeneric(
  endpoint: string,
  request: { prompt: string; lora_url?: string },
  errorContext: string
): Promise<AvatarImageResponse> {
  try {
    const randomSeed = Math.floor(Math.random() * 10001);
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt: request.prompt,
        random_noise: randomSeed,
        ...(request.lora_url ? { lora_url: request.lora_url } : {})
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
    if (!url) throw new Error(`No image URL found in ${errorContext} response`);
    return { url, file_name };
  } catch (error) {
    console.error(`Error generating avatar image (${errorContext}):`, error);
    throw error;
  }
}


// SRPO via Flux: response at data.images[{ url, width, height, content_type }]
export async function generateAvatarImageFluxSrpo(
  request: { prompt: string; image_size?: 'portrait_16_9' | 'landscape_16_9' }
): Promise<AvatarImageResponse> {
  const styleConfig = AVATAR_STYLES['studio'];
  try {
    const result = await fal.subscribe(styleConfig.falEndpoint!, {
      input: {
        prompt: request.prompt,
        ...(request.image_size ? { image_size: request.image_size } : {})
      },
      logs: true
    });

    const data: any = (result as any).data;
    const images = data?.images;
    if (!Array.isArray(images) || images.length === 0 || !images[0]?.url) {
      throw new Error("No image URL found in Flux SRPO response");
    }
    const img = images[0];
    return {
      url: img.url,
      width: img.width,
      height: img.height,
      content_type: img.content_type
    };
  } catch (error) {
    console.error("Error generating avatar image (Flux SRPO):", error);
    throw error;
  }
}

// Main function to generate avatar image by style
export async function generateAvatarImageByStyle(
  styleKey: AvatarStyleKey,
  request: { prompt: string; image_size?: 'portrait_16_9' | 'landscape_16_9' }
): Promise<AvatarImageResponse> {
  const styleConfig = AVATAR_STYLES[styleKey];

  // Determine if it's a Comfy or Flux endpoint
  const isComfyEndpoint = styleConfig.falEndpoint?.includes('comfy/');
  
  if (isComfyEndpoint) {
    // Use horizontal endpoint if landscape and available
    const endpoint = request.image_size === 'landscape_16_9' && styleConfig.falEndpointHorizontal 
      ? styleConfig.falEndpointHorizontal 
      : styleConfig.falEndpoint!;
    
    return generateAvatarImageComfyGeneric(
      endpoint, 
      { prompt: request.prompt, lora_url: styleConfig.loraUrl }, 
      `Comfy SRPO ${styleKey}`
    );
  } else {
    // Flux endpoint
    return generateAvatarImageFluxSrpo(request);
  }
}

// OmniHuman types and constants
export const OMNIHUMAN_ENDPOINT = "fal-ai/bytedance/omnihuman/v1.5";

export interface OmniHumanRequest {
  image_url: string;
  audio_url: string;
}

export interface OmniHumanResponse {
  video: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
}

export interface OmniHumanQueueResult {
  data?: OmniHumanResponse;
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

/**
 * Start OmniHuman avatar video generation
 */
export async function startOmniHumanVideoGeneration(
  request: OmniHumanRequest
): Promise<{ request_id: string }> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[TEST MODE] Simulating OmniHuman video generation');
    return { request_id: 'omnihuman-test-' + Date.now() };
  }
  
  try {
    const result = await fal.queue.submit(OMNIHUMAN_ENDPOINT, {
      input: {
        image_url: request.image_url,
        audio_url: request.audio_url
      }
    });

    console.log(`OmniHuman video generation started, request_id: ${result.request_id}`);
    return { request_id: result.request_id };
  } catch (error) {
    console.error('Error starting OmniHuman video generation:', error);
    throw error;
  }
}

/**
 * Check OmniHuman request status
 */
export async function checkOmniHumanRequestStatus(
  requestId: string
): Promise<FalQueueStatus> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TEST MODE] Checking OmniHuman status for request ID: ${requestId}`);
    
    // Simulate different states based on elapsed time
    const now = Date.now();
    const requestTime = parseInt(requestId.split('-').pop() || '0');
    const elapsedSeconds = Math.floor((now - requestTime) / 1000);
    
    if (elapsedSeconds < 5) {
      return { 
        status: "IN_QUEUE", 
        queue_position: Math.max(1, 3 - Math.floor(elapsedSeconds / 2)) 
      };
    } else if (elapsedSeconds < 15) {
      return { 
        status: "IN_PROGRESS",
        logs: [{ 
          message: `Processing OmniHuman video (${Math.floor((elapsedSeconds - 5) / 10 * 100)}%)`, 
          level: "info", 
          timestamp: new Date().toISOString() 
        }]
      };
    } else {
      return { 
        status: "COMPLETED",
        response_url: "https://example.com/omnihuman-completed" 
      };
    }
  }

  try {
    const status = await fal.queue.status(OMNIHUMAN_ENDPOINT, {
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
    console.error('Error checking OmniHuman request status:', error);
    throw error;
  }
}

/**
 * Get OmniHuman request result
 */
export async function getOmniHumanRequestResult(
  requestId: string
): Promise<OmniHumanQueueResult> {
  try {
    const result = await fal.queue.result(OMNIHUMAN_ENDPOINT, {
      requestId: requestId
    });

    return {
      data: result.data as OmniHumanResponse
    };
  } catch (error) {
    console.error('Error getting OmniHuman request result:', error);
    throw error;
  }
}

/**
 * Start Veo3 video generation
 */
export async function startVeo3VideoGeneration(
  request: Veo3Request,
  mode: Veo3GenerationMode = Veo3GenerationMode.FAST,
  mock: Boolean = false
): Promise<{ request_id: string }> {
  if (mock) {
    console.log(`[TEST MODE] Simulating Veo3 video generation with mode: ${mode}`);
    return { request_id: 'a80bc54f-2147-42a7-b5d4-4b429b8d5bf9' };
  }

  try {
    const endpoint = VEO3_ENDPOINTS[mode];

    const result = await fal.queue.submit(endpoint, {
      input: {
        prompt: request.prompt,
        image_url: request.image_url,
        duration: request.duration || "8s",
        aspect_ratio: request.aspect_ratio || "9:16",
        generate_audio: request.generate_audio || true,
        resolution: request.resolution || "720p"
      }
    });

    console.log(`Veo3 video generation started with mode: ${mode}, request_id: ${result.request_id}`);
    return { request_id: result.request_id };
  } catch (error) {
    console.error(`Error starting Veo3 video generation (${mode}):`, error);
    throw error;
  }
}

/**
 * Check Veo3 request status
 */
export async function checkVeo3RequestStatus(
  requestId: string,
  mode: Veo3GenerationMode = Veo3GenerationMode.FAST
): Promise<FalQueueStatus> {
  try {
    const endpoint = VEO3_ENDPOINTS[mode];

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
    console.error('Error checking Veo3 request status:', error);
    throw error;
  }
}

/**
 * Get Veo3 request result
 */
export async function getVeo3RequestResult(
  requestId: string,
  mode: Veo3GenerationMode = Veo3GenerationMode.FAST
): Promise<{ data?: Veo3Response }> {
  try {
    const endpoint = VEO3_ENDPOINTS[mode];

    const result = await fal.queue.result(endpoint, {
      requestId: requestId
    });

    return {
      data: result.data as Veo3Response
    };
  } catch (error) {
    console.error('Error getting Veo3 request result:', error);
    throw error;
  }
} 