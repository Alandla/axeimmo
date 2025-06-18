export interface FirecrawlScrapedResult {
  url: string;
  markdown: string;
  title?: string;
  description?: string;
  language?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  statusCode?: number;
}

export interface FirecrawlResponse {
  success: boolean;
  data: FirecrawlScrapedResult;
}

export interface FirecrawlBatchResponse {
  results: FirecrawlScrapedResult[];  
}

export async function scrapeUrl(url: string): Promise<FirecrawlScrapedResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        excludeTags: ['nav', 'footer', 'aside', 'script', 'style'],
        onlyMainContent: true,
        timeout: 30000
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const result: FirecrawlResponse = await response.json();

    if (!result.success) {
      throw new Error('Firecrawl scraping failed');
    }

    return result.data;
  } catch (error) {
    console.error(`Error scraping URL ${url}:`, error);
    throw new Error(`Failed to scrape URL: ${url}`);
  }
}

export async function scrapeUrls(urls: string[]): Promise<FirecrawlBatchResponse> {
  const scrapingPromises = urls.map(url => scrapeUrl(url));
  
  try {
    const results = await Promise.all(scrapingPromises);
    return { results };
  } catch (error) {
    console.error('Error scraping URLs:', error);
    throw new Error('Failed to scrape one or more URLs');
  }
} 