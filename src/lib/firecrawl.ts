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
        timeout: 60000
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

async function processWithConcurrencyLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  limit: number = 2
): Promise<R[]> {
  return new Promise((resolve, reject) => {
    const results: R[] = [];
    const queue = [...items];
    let running = 0;
    let completed = 0;
    let hasError = false;

    const processNext = async () => {
      if (hasError || queue.length === 0) {
        return;
      }

      const item = queue.shift()!;
      const index = items.indexOf(item);
      running++;

      try {
        const result = await processor(item);
        results[index] = result;
        completed++;
        running--;

        if (completed === items.length) {
          resolve(results);
        } else {
          processNext();
        }
      } catch (error) {
        hasError = true;
        running--;
        reject(error);
      }
    };

    // Start initial batch (up to limit)
    for (let i = 0; i < Math.min(limit, items.length); i++) {
      processNext();
    }
  });
}

export async function scrapeUrls(urls: string[]): Promise<FirecrawlBatchResponse> {
  try {
    const results = await processWithConcurrencyLimit(urls, scrapeUrl, 2);
    return { results };
  } catch (error) {
    console.error('Error scraping URLs:', error);
    throw new Error('Failed to scrape one or more URLs');
  }
} 