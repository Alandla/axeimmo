import { generateScript, improveScript } from './stream'
import { extractUrls } from './article'
import { basicApiCall } from './api'
import { FirecrawlBatchResponse } from './firecrawl'

export interface ScriptGenerationOptions {
  prompt: string;
  duration?: number;
  webSearch?: boolean;
  improvementContext?: string;
}

export interface ScriptGenerationResult {
  script: string;
  cost?: number;
  urlScrapingResults?: any[];
}

export async function generateVideoScript(options: ScriptGenerationOptions): Promise<ScriptGenerationResult> {
  const { prompt, duration = 60, webSearch = false, improvementContext } = options;
  
  let urlScrapingResult = null;
  let totalCost = 0;

  // Gestion des URLs si webSearch est activé
  if (webSearch) {
    const urls = extractUrls(prompt);
    if (urls.length > 0) {
      try {
        const urlContents = await basicApiCall<FirecrawlBatchResponse>('/search/url', {
          urls,
          planName: 'ENTREPRISE' // Les clients API ont accès aux fonctionnalités entreprise
        });
        urlScrapingResult = urlContents.results;
      } catch (error) {
        console.error("Error processing URLs:", error);
      }
    }
  }

  // Génération du script
  let stream;
  if (improvementContext) {
    // Convertir le contexte en format messagesList
    const messagesList = [{ content: improvementContext, role: 'user' }];
    stream = await improveScript(prompt, messagesList);
  } else {
    stream = await generateScript(prompt, duration, webSearch, urlScrapingResult);
  }

  if (!stream) {
    throw new Error('Failed to generate script');
  }

  // Lecture du stream et extraction du script
  let finalScript = '';
  let finalCost = 0;

  return new Promise((resolve, reject) => {
    const reader = stream.getReader();
    let buffer = '';
    
    const readChunk = async () => {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          // Traitement final du buffer
          const scriptStartIndex = buffer.indexOf('```');
          if (scriptStartIndex !== -1) {
            let script = buffer.slice(scriptStartIndex + 3);
            const scriptEndIndex = script.lastIndexOf('```');
            if (scriptEndIndex !== -1) {
              script = script.slice(0, scriptEndIndex);
            }
            finalScript = script.trim();
          } else {
            finalScript = buffer.trim();
          }

          resolve({
            script: finalScript,
            cost: finalCost,
            urlScrapingResults: urlScrapingResult || undefined
          });
          return;
        }

        const chunk = new TextDecoder().decode(value);
        buffer += chunk;
        
        readChunk();
      } catch (error) {
        reject(error);
      }
    };

    readChunk();
  });
}