import { FirecrawlBatchResponse, FirecrawlScrapedResult } from './firecrawl'
import { IMedia } from '../types/video'
import { extractedImagesToMedia, analyzeAndFilterExtractedImages } from './extracted-images'
import { PlanName } from '../types/enums'

export interface UrlExtractionOptions {
  urls: string[]
  planName?: PlanName
  enableImageExtraction?: boolean
  setExtractedImagesMedia?: (images: IMedia[]) => void
  extractedImagesMedia?: IMedia[]
}

export interface UrlExtractionResult {
  content: FirecrawlScrapedResult[]
  extractedImages: string[]
  cost: number
  imageExtractionPromise?: Promise<string[]>
}

// Interface pour abstraire les différentes méthodes de scraping
export interface ScrapingMethods {
  scrapeBrowserBase: (urls: string[]) => Promise<FirecrawlScrapedResult[]>
  scrapeFirecrawl: (urls: string[]) => Promise<FirecrawlScrapedResult[]>
  extractImages: (content: FirecrawlScrapedResult[]) => Promise<{ images: string[]; cost: number }>
}

/**
 * Fonction principale d'extraction d'URLs (logique commune)
 * Cette fonction contient toute la logique métier partagée entre client et serveur
 */
export async function extractFromUrlsCore(
  options: UrlExtractionOptions, 
  scrapingMethods: ScrapingMethods | Promise<ScrapingMethods>
): Promise<UrlExtractionResult> {
  // Résoudre la promesse si nécessaire
  const resolvedMethods = await scrapingMethods
  const { 
    urls, 
    planName = PlanName.FREE, 
    enableImageExtraction = false,
    setExtractedImagesMedia,
    extractedImagesMedia = []
  } = options

  if (urls.length === 0) {
    return { content: [], extractedImages: [], cost: 0 }
  }

  let totalCost = 0
  let allExtractedImages: string[] = []

  // Separate URLs that require BrowserBase vs Firecrawl
  const browserBaseUrls = urls.filter(url => 
    url.includes('fairmoove.fr') || url.includes('odisseias.com') || url.includes('laforet.com')
  )
  const firecrawlUrls = urls.filter(url => 
    !url.includes('fairmoove.fr') && !url.includes('odisseias.com') && !url.includes('laforet.com')
  )

  let combinedResults: FirecrawlScrapedResult[] = []

  // Process BrowserBase URLs if any
  if (browserBaseUrls.length > 0) {
    console.log("Using BrowserBase for special URLs:", browserBaseUrls)
    const browserBaseResults = await resolvedMethods.scrapeBrowserBase(browserBaseUrls)
    combinedResults.push(...browserBaseResults)
    totalCost += browserBaseUrls.length * 0.1
  }

  // Process Firecrawl URLs if any
  if (firecrawlUrls.length > 0) {
    console.log("Using Firecrawl for URLs:", firecrawlUrls)
    const firecrawlResults = await resolvedMethods.scrapeFirecrawl(firecrawlUrls)
    combinedResults.push(...firecrawlResults)
    totalCost += firecrawlUrls.length * 0.1
  }

  let imageExtractionPromise: Promise<string[]> | undefined;

  // Extract images if enabled and we have content
  if (enableImageExtraction && combinedResults.length > 0) {
    // Si on a un callback (interface utilisateur), on traite en arrière-plan
    if (setExtractedImagesMedia) {
      // Version client-side avec callback - le coût sera ajouté en arrière-plan
      resolvedMethods.extractImages(combinedResults).then(extractionResult => {
        const extractedImages = extractionResult.images
        console.log(`Image extraction cost: ${extractionResult.cost}`)
        
        if (extractedImages.length > 0) {
          console.log("Processing extracted images for media store...")
          
          extractedImagesToMedia(extractedImages)
            .then(imagesMedia => {
              console.log("Images saved to store:", imagesMedia)
              setExtractedImagesMedia([...extractedImagesMedia, ...imagesMedia])
              
              // Start background analysis
              console.log("Starting background image analysis...")
              analyzeAndFilterExtractedImages(extractedImages, (filteredImages) => {
                console.log("Updated store with filtered images:", filteredImages)
                setExtractedImagesMedia(filteredImages)
              })
            })
            .catch(error => {
              console.error("Error processing extracted images:", error)
            })
        }
      }).catch(error => {
        console.error("Error in background image extraction:", error)
      })
    } else {
      // Version serveur avec promesse retournée - le coût sera inclus dans le résultat
      imageExtractionPromise = resolvedMethods.extractImages(combinedResults).then(extractionResult => {
        return extractionResult.images
      })
    }
  }

  return {
    content: combinedResults,
    extractedImages: allExtractedImages,
    cost: totalCost,
    imageExtractionPromise
  }
}