import {
  HiggsfieldClient,
  SoulSize,
  SoulQuality,
  BatchSize,
  strength,
  seed,
  InputImage,
  webhook,
  type SoulStyle,
  type JobSet,
  type Job,
} from "@higgsfield/client";

// Higgsfield client configuration
let client: HiggsfieldClient | null = null;

function getClient(): HiggsfieldClient {
  if (!client) {
    client = new HiggsfieldClient({
      apiKey: process.env.HIGGSFIELD_API_KEY,
      apiSecret: process.env.HIGGSFIELD_SECRET_KEY,
      timeout: 120000, // 2 minutes
      maxRetries: 3,
      retryBackoff: 1000,
      retryMaxBackoff: 60000,
      pollInterval: 2000,
      maxPollTime: 300000,
    });
  }
  return client;
}

// Soul generation interfaces
export interface SoulImageRequest {
  prompt: string;
  width_and_height?: string;
  quality?: string;
  batch_size?: any; // Accept both string and enum values
  style_id?: string;
  style_strength?: number;
  custom_reference_id?: string;
  custom_reference_strength?: number;
  image_reference?: string;
  enhance_prompt?: boolean;
  seed_value?: number;
  webhook_url?: string;
  webhook_secret?: string;
}

export interface SoulImageResponse {
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  job_id: string;
  status: "completed" | "failed" | "processing" | "queued";
}

export interface SoulStyleInfo {
  id: string;
  name: string;
  description: string;
  preview_url: string;
}

// Soul image generation via Higgsfield
export async function generateSoulImage(
  request: SoulImageRequest,
): Promise<SoulImageResponse[]> {
  const client = getClient();

  try {
    // Build generation parameters
    const params: any = {
      prompt: request.prompt,
      width_and_height: request.width_and_height || SoulSize.PORTRAIT_1088x1632,
      quality: request.quality || SoulQuality.SD,
      batch_size: BatchSize.SINGLE, // Always use single batch by default
      enhance_prompt: true, // Always enhance prompt by default,
      image_reference: request.image_reference
    };

    // Add optional parameters
    if (request.style_id) {
      params.style_id = request.style_id;
      params.style_strength = request.style_strength
        ? strength(request.style_strength)
        : strength(0.8);
    }

    if (request.image_reference) {
      params.image_reference = InputImage.fromUrl(request.image_reference);
    }

    if (request.seed_value !== undefined) {
      params.seed = seed(request.seed_value);
    }

    // Build options
    const options: any = {
      withPolling: true, // Enable automatic polling
    };

    if (request.webhook_url && request.webhook_secret) {
      options.webhook = webhook(request.webhook_url, request.webhook_secret);
    }

    // Generate images
    const jobSet: JobSet = await client.generate(
      "/v1/text2image/soul",
      params,
      options
    );

    // Process results
    const results: SoulImageResponse[] = [];

    for (const job of jobSet.jobs) {
      const response: SoulImageResponse = {
        job_id: job.id,
        status: job.status as "completed" | "failed" | "processing" | "queued",
        url: "",
        thumbnail_url: "",
        width: 0,
        height: 0,
        content_type: "",
        file_name: "",
        file_size: 0,
      };

      if (job.status === "completed" && job.results) {
        response.url = job.results.raw.url;
        response.thumbnail_url = job.results.min?.url || job.results.raw.url;
        // Note: Additional properties may not be available in all result types
        response.width = (job.results.raw as any).width || 0;
        response.height = (job.results.raw as any).height || 0;
        response.content_type = (job.results.raw as any).content_type || "";
        response.file_name = (job.results.raw as any).file_name || "";
        response.file_size = (job.results.raw as any).file_size || 0;
      }

      results.push(response);
    }

    return results;
  } catch (error) {
    console.error("Error generating Soul image:", error);
    throw error;
  }
}

// Get available Soul styles
export async function getSoulStyles(): Promise<SoulStyleInfo[]> {
  const client = getClient();

  try {
    const styles: SoulStyle[] = await client.getSoulStyles();

    return styles.map((style) => ({
      id: style.id,
      name: style.name,
      description: style.description,
      preview_url: style.preview_url,
    }));
  } catch (error) {
    console.error("Error fetching Soul styles:", error);
    throw error;
  }
}

// Close the client connection
export function closeHiggsfieldClient(): void {
  if (client) {
    client.close();
    client = null;
  }
}

// Simplified Soul image generation - only requires prompt and format
export async function generateSoulImageSimple(
  prompt: string,
  format: 'vertical' | 'horizontal' | 'square' | 'ads',
  image_reference?: string
): Promise<SoulImageResponse> {
  // Map format to SoulSize
  const sizeMap = {
    'vertical': SoulSize.PORTRAIT_1088x1632,
    'horizontal': SoulSize.LANDSCAPE_1632x1088,
    'square': SoulSize.PORTRAIT_1088x1632, // Use portrait for square format
    'ads': SoulSize.PORTRAIT_1088x1632 // Use portrait for ads format
  };

  const results = await generateSoulImage({
    prompt,
    width_and_height: sizeMap[format],
    image_reference: image_reference
  });

  // Return first result (since batch_size is always SINGLE)
  if (!results || results.length === 0) {
    throw new Error("No image generated from Soul API");
  }

  return results[0];
}

// Export SoulSize and SoulQuality for external use
export {
  SoulSize,
  SoulQuality,
  BatchSize,
  strength,
  seed,
} from "@higgsfield/client";
