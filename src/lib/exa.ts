import Exa from 'exa-js';

const EXA_API_KEY = process.env.EXA_API_KEY;

if (!EXA_API_KEY) {
  console.warn('EXA_API_KEY is not defined in environment variables');
}

const exa = new Exa(EXA_API_KEY || '');

// Types pour les résultats d'Exa
export interface ExaCleanedSubpage {
  title: string;
  url: string;
  text: string;
}

export interface ExaCleanedResult {
  title: string;
  url: string;
  text: string;
  subpages?: ExaCleanedSubpage[];
  image?: string;
  favicon?: string;
}

export interface ExaCleanedResponse {
  results: ExaCleanedResult[];
  costDollars?: {
    total: number;
    contents?: {
      text?: number;
    }
  }
}

/**
 * Nettoie les résultats de la recherche Exa en enlevant les champs non nécessaires
 * @param exaResponse - La réponse brute d'Exa
 * @param includeImage - Si true, inclut l'image dans les résultats (false par défaut)
 */
export function cleanExaResults(exaResponse: any, includeImage: boolean = false, includeFavicon: boolean = false): ExaCleanedResponse {
  if (!exaResponse || !exaResponse.results) {
    return { results: [] };
  }

  // Filtrer les champs de chaque résultat
  const cleanResults = exaResponse.results.map((result: any) => {
    const { title, url, text, image, favicon } = result;
    
    let cleanedResult: ExaCleanedResult = { 
      title, 
      url, 
      text,
    };
    
    // Inclure l'image uniquement si demandé
    if (includeImage && image) {
      cleanedResult.image = image;
    }

    if (includeFavicon && favicon) {
      cleanedResult.favicon = favicon;
    }
    
    // Traiter les sous-pages si elles existent
    if (result.subpages && Array.isArray(result.subpages)) {
      cleanedResult.subpages = result.subpages.map((subpage: any) => {
        const { title, url, text } = subpage;
        return { title, url, text };
      });
    }
    
    return cleanedResult;
  });

  // Ajouter les informations de coût
  return { 
    results: cleanResults,
    costDollars: exaResponse.costDollars
  };
}

/**
 * Find informations about a company from its website
 * @param website - The domain of the company website (ex: "elevenlabs.io")
 * @returns Informations about the company
 */
export async function getCompanyInfo(website: string): Promise<ExaCleanedResponse> {
  try {
    const result = await exa.searchAndContents(
      website,
      {
        category: "company",
        type: "keyword",
        text: true,
        numResults: 1,
        livecrawl: "always",
        includeDomains: [website]
      }
    );

    return cleanExaResults(result);
  } catch (error) {
    console.error('Error fetching company info from Exa:', error);
    throw error;
  }
}

/**
 * Récupère le contenu d'une URL spécifique via Exa AI
 * @param url - L'URL complète de la page à récupérer
 * @returns Le contenu de la page avec le titre, texte, image, etc.
 */
export async function getUrlContent(url: string): Promise<ExaCleanedResponse> {
  try {
    const result = await exa.getContents(
      [url],
      {
        livecrawl: "always",
        text: true
      }
    );

    return cleanExaResults(result, true, true);
  } catch (error) {
    console.error('Error fetching URL content from Exa:', error);
    throw error;
  }
}

/**
 * Effectue une recherche à partir d'une requête textuelle
 * @param query - La requête de recherche
 * @param maxResults - Nombre maximum de résultats (défaut: 5)
 * @returns Les résultats de la recherche
 */
export async function searchQuery(query: string, maxResults: number = 5): Promise<ExaCleanedResponse> {
  try {
    const result = await exa.search(
      query,
      {
        numResults: maxResults,
        type: "keyword"
      }
    );

    console.log(result);

    return cleanExaResults(result, false, true);
  } catch (error) {
    console.error('Error performing search with Exa:', error);
    throw error;
  }
} 