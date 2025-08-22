import { generateScriptDirect } from './ai-script-generation'
import { PlanName } from '../types/enums'
import { extractFromUrlsServer } from './url-extraction-server'

export interface ScriptGenerationOptions {
  prompt: string;
  duration?: number;
  urls?: string[];
  webSearch?: boolean;
  planName?: PlanName;
  improvementContext?: string;
  urlContent?: any[]; // Contenu des URLs déjà extrait
}

export interface ScriptGenerationResult {
  script: string;
  cost?: number;
  extractedImages?: string[];
  urlScrapingResults?: any[];
}

export interface CostCalculationOptions {
  duration?: number;
  urls?: string[];
  webSearch?: boolean;
}

/**
 * Calculate the estimated cost for script generation based on parameters
 * @param options - Cost calculation options
 * @returns Estimated cost in credits
 */
export function calculateScriptGenerationCost(options: CostCalculationOptions): number {
  const { duration = 60, urls = [], webSearch = false } = options;
  
  let totalCost = 0;

  // Base cost for script generation (0.1 credit per started 60s tranche)
  // 1-60s = 0.1, 61-120s = 0.2, 121-180s = 0.3, 181-240s = 0.4, etc.
  totalCost += Math.ceil(duration / 60) * 0.1;

  // Web search cost (0.1 credit if enabled)
  if (webSearch) {
    totalCost += 0.1;
  }

  // URL processing cost (0.1 credit per URL)
  totalCost += urls.length * 0.1;

  return totalCost;
}

/**
 * Prépare l'extraction d'URLs et d'images (version server-side)
 */
async function prepareUrlAndImageExtractionServer(
  urls: string[], 
  planName: PlanName, 
  providedUrlContent?: any[]
): Promise<{
  urlContent: any[] | null;
  extractedImages: string[];
  cost: number;
}> {
  // Si pas d'URLs ou contenu déjà fourni, pas d'extraction
  if (urls.length === 0 || providedUrlContent) {
    return {
      urlContent: providedUrlContent || null,
      extractedImages: [],
      cost: 0
    };
  }

  // Lancer l'extraction d'URLs et d'images (version server-side)
  const extractionResult = await extractFromUrlsServer({
    urls,
    planName,
    enableImageExtraction: true
  });

  // Attendre les images si elles sont en cours d'extraction
  const extractedImages = extractionResult.imageExtractionPromise 
    ? await extractionResult.imageExtractionPromise
    : extractionResult.extractedImages;

  return {
    urlContent: extractionResult.content,
    extractedImages,
    cost: extractionResult.cost
  };
}

/**
 * Génère un script vidéo directement (sans streaming) pour l'API publique
 */
export async function generateVideoScriptDirect(options: ScriptGenerationOptions): Promise<ScriptGenerationResult & { extractedImages: string[] }> {
  const { 
    prompt, 
    duration = 60, 
    urls = [], 
    webSearch = false, 
    planName = PlanName.FREE,
    improvementContext,
    urlContent: providedUrlContent
  } = options;

  // Préparer l'extraction d'URLs et d'images (version server-side)
  const { urlContent, extractedImages, cost: extractionCost } = await prepareUrlAndImageExtractionServer(
    urls, 
    planName, 
    providedUrlContent
  );
  
  // Générer le script directement (sans streaming)
  const result = await generateScriptDirect({
    prompt,
    duration,
    urlScrapingResult: urlContent,
    webSearch
  });

  return {
    script: result.script,
    cost: (result.cost || 0) + extractionCost,
    extractedImages,
    urlScrapingResults: urlContent || undefined
  };
}