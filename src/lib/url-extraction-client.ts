import { basicApiCall } from './api'
import { FirecrawlBatchResponse } from './firecrawl'
import { scrapeBrowserBaseUrls, ExtractedImagesResponse } from './browserbase-scraper'
import { 
  UrlExtractionOptions, 
  UrlExtractionResult, 
  ScrapingMethods,
  extractFromUrlsCore
} from './url-extraction-core'
import { PlanName } from '../types/enums'

/**
 * Crée les méthodes de scraping pour le côté client (via API calls)
 */
function createClientScrapingMethods(
  setExtractedImagesMedia?: (images: any[]) => void,
  extractedImagesMedia: any[] = []
): ScrapingMethods {
  return {
    scrapeBrowserBase: async (urls: string[]) => {
      const browserBaseResults = await scrapeBrowserBaseUrls(
        urls, 
        setExtractedImagesMedia || (() => {}),
        extractedImagesMedia
      )
      
      return browserBaseResults.map(result => ({
        url: result.url,
        markdown: result.markdown,
        title: result.title
      }))
    },

    scrapeFirecrawl: async (urls: string[]) => {
      const firecrawlResults = await basicApiCall<FirecrawlBatchResponse>('/search/url', {
        urls,
        planName: PlanName.FREE // Will be overridden by caller
      })
      return firecrawlResults.results
    },

    extractImages: async (content) => {
      let totalCost = 0
      const imageExtractionPromises = content
        .filter(result => 
          !result.url || (!result.url.includes('fairmoove.fr') && !result.url.includes('odisseias.com') && !result.url.includes('laforet.com') && !result.url.includes('bienici.com'))
        )
        .map(async (result) => {
          try {
            const imageResult = await basicApiCall<ExtractedImagesResponse>('/ai/extract-images', {
              markdownContent: result.markdown
            })
            totalCost += imageResult.cost || 0
            return imageResult.relevantImages || []
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
 * Extract content and images from URLs using appropriate scraping services (client-side)
 * Combines Firecrawl and BrowserBase based on URL requirements
 */
export async function extractFromUrls(options: UrlExtractionOptions): Promise<UrlExtractionResult> {
  const scrapingMethods = createClientScrapingMethods(
    options.setExtractedImagesMedia,
    options.extractedImagesMedia
  )
  return extractFromUrlsCore(options, scrapingMethods)
}