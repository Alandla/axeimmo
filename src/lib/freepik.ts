import axios from "axios";

const FREEPIK_API_URL = "https://api.freepik.com/v1";

export enum UpscaleEngine {
  MAGNIFIC_SPARKLE = "magnific_sparkle",
  STANDARD = "standard",
}

export enum OptimizedFor {
  SOFT_PORTRAITS = "soft_portraits",
  HARD_PORTRAITS = "hard_portraits",
}

export type ScaleFactor = "2x" | "4x" | "8x";

export interface FreepikUpscaleRequest {
  image: string;
  scale_factor?: ScaleFactor;
  optimized_for?: OptimizedFor;
  creativity?: number;
  hdr?: number;
  resemblance?: number;
  fractality?: number;
  engine?: UpscaleEngine;
  webhook_url?: string;
}

export interface FreepikUpscaleFromUrlRequest {
  image_url: string;
  scale_factor?: ScaleFactor;
  optimized_for?: OptimizedFor;
  creativity?: number;
  hdr?: number;
  resemblance?: number;
  fractality?: number;
  engine?: UpscaleEngine;
  webhook_url?: string;
}

export interface FreepikUpscaleResponse {
  data: {
    generated: string[];
    task_id: string;
    status: string;
    error?: string;
  };
}

export async function upscaleImage(request: FreepikUpscaleRequest): Promise<FreepikUpscaleResponse> {
  try {
    const data: FreepikUpscaleRequest = {
      image: request.image,
      scale_factor: "2x",
      optimized_for: OptimizedFor.SOFT_PORTRAITS,
      hdr: 7,
    };

    if (request.webhook_url) {
      data.webhook_url = request.webhook_url;
    }

    const response = await axios.post(`${FREEPIK_API_URL}/ai/image-upscaler`, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-freepik-api-key": process.env.FREEPIK_API_KEY,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Freepik API returned status code ${response.status}`);
    }

    console.log(`Image upscale request sent successfully:`, JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error("Error upscaling image:", error.response?.data || error.message);
    throw error;
  }
}

export async function upscaleImageFromUrl(request: FreepikUpscaleFromUrlRequest): Promise<FreepikUpscaleResponse> {
  try {
    const imageResponse = await axios.get(request.image_url, { responseType: "arraybuffer" });
    const imageBase64 = Buffer.from(imageResponse.data, "binary").toString("base64");

    return await upscaleImage({
      image: imageBase64,
      webhook_url: request.webhook_url,
    });
  } catch (error: any) {
    console.error("Error fetching or upscaling image from URL:", error?.response?.data || error?.message || error);
    throw error;
  }
}
