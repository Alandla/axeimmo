import { FirecrawlScrapedResult, scrapeUrls } from './firecrawl'
import { extractQuickContent, getBrowserBaseConfig } from './browserbase'
import { webPageContentExtractionRun } from './workflowai'
import { 
  UrlExtractionOptions, 
  UrlExtractionResult, 
  ScrapingMethods,
  extractFromUrlsCore
} from './url-extraction-core'

/**
 * Crée les méthodes de scraping pour le côté serveur (appels directs)
 * Ces méthodes ne peuvent être utilisées que côté serveur car elles importent des modules Node.js
 */
function createServerScrapingMethods(): ScrapingMethods {
  return {
    scrapeBrowserBase: async (urls: string[]): Promise<FirecrawlScrapedResult[]> => {
      const config = getBrowserBaseConfig()
      
      const browserBaseResults = await Promise.all(
        urls.map(async (url) => {
          try {
            const { content } = await extractQuickContent(url, config)
            return {
              url,
              markdown: content.content,
              title: content.title,
              success: true
            }
          } catch (error) {
            console.error(`BrowserBase extraction failed for ${url}:`, error)
            return { 
              url, 
              markdown: '', 
              title: '', 
              success: false 
            }
          }
        })
      )
      
      return browserBaseResults
        .filter(result => result.success)
        .map(result => ({
          url: result.url,
          markdown: result.markdown,
          title: result.title
        }))
    },

    scrapeFirecrawl: async (urls: string[]): Promise<FirecrawlScrapedResult[]> => {
      try {
        const firecrawlResults = await scrapeUrls(urls)
        return firecrawlResults.results
      } catch (error) {
        console.error("Error scraping URLs with Firecrawl:", error)
        return []
      }
    },

    extractImages: async (content: FirecrawlScrapedResult[]): Promise<{ images: string[]; cost: number }> => {
      let totalCost = 0
      const imageExtractionPromises = content
        .filter(result => 
          !result.url || (!result.url.includes('fairmoove.fr') && !result.url.includes('odisseias.com') && !result.url.includes('laforet.com'))
        )
        .map(async (result) => {
          try {
            console.log(`Server-side image extraction for ${result.url}...`)
            const extractionResult = await webPageContentExtractionRun(result.markdown)
            totalCost += extractionResult.cost
            return extractionResult.relevantImages
          } catch (error) {
            console.error(`Error extracting images from ${result.url}:`, error)
            return []
          }
        })

      const imageResults = await Promise.all(imageExtractionPromises)
      return {
        images: imageResults.flat(),
        cost: totalCost
      }
    }
  }
}

/**
 * Server-side version of extractFromUrls that calls business functions directly
 * Used by API routes to avoid calling internal APIs
 */
export async function extractFromUrlsServer(options: Omit<UrlExtractionOptions, 'setExtractedImagesMedia' | 'extractedImagesMedia'>): Promise<UrlExtractionResult> {
  const scrapingMethods = createServerScrapingMethods()
  return extractFromUrlsCore(options, scrapingMethods)
}