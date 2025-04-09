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
}

export interface ExaCleanedResponse {
  results: ExaCleanedResult[];
}

/**
 * Nettoie les résultats de la recherche Exa en enlevant les champs non nécessaires
 */
export function cleanExaResults(exaResponse: any): ExaCleanedResponse {
  if (!exaResponse || !exaResponse.results) {
    return { results: [] };
  }

  // Filtrer les champs de chaque résultat
  const cleanResults = exaResponse.results.map((result: any) => {
    const { title, url, text } = result;
    
    let cleanedResult: ExaCleanedResult = { title, url, text };
    
    // Traiter les sous-pages si elles existent
    if (result.subpages && Array.isArray(result.subpages)) {
      cleanedResult.subpages = result.subpages.map((subpage: any) => {
        const { title, url, text } = subpage;
        return { title, url, text };
      });
    }
    
    return cleanedResult;
  });

  return { results: cleanResults };
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