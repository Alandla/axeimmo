import { basicApiCall } from './api'
import { IMedia } from '../types/video'
import { extractedImagesToMedia, analyzeAndFilterExtractedImages } from './extracted-images'

export interface BrowserBaseScrapeResult {
  url: string;
  markdown: string;
  title: string;
  sessionId: string | null;
  connectUrl: string;
  hasBackgroundProcessing: boolean;
  success: boolean;
}

export interface ExtractedImagesResponse {
  relevantImages: string[];
  cost: number;
}

export const scrapeBrowserBaseUrls = async (
  urls: string[],
  setExtractedImagesMedia: (images: IMedia[]) => void,
  extractedImagesMedia: IMedia[]
): Promise<BrowserBaseScrapeResult[]> => {
  // Phase 1: Quick content extraction using BrowserBase (for fast script generation)
  const enhancedResults = await Promise.all(
    urls.map(async (url) => {
      try {
        const result: any = await basicApiCall('/article/extract-enhanced', { url });
        return {
          url,
          markdown: result.content,
          title: result.title,
          sessionId: result.sessionId,
          connectUrl: result.connectUrl,
          hasBackgroundProcessing: result.hasBackgroundProcessing,
          success: true
        };
      } catch (error) {
        console.error(`Enhanced extraction failed for ${url}:`, error);
        return { url, markdown: '', title: '', sessionId: null, connectUrl: '', hasBackgroundProcessing: false, success: false };
      }
    })
  );

  console.log("enhancedResults", enhancedResults);

  const successfulResults = enhancedResults.filter(r => r.success);

  // Phase 2: Start background image extraction using the same BrowserBase sessions
  if (successfulResults.length > 0) {
    const urlsWithBackground = successfulResults.filter(r => r.hasBackgroundProcessing && r.sessionId);
    
    if (urlsWithBackground.length > 0) {
      console.log("Lancement de l'extraction d'images en arrière-plan avec BrowserBase...");
      
      // Process background image extraction for each URL
      urlsWithBackground.forEach(async (result) => {
        try {
          console.log(`Récupération des images en arrière-plan pour ${result.url}...`);
          const imageResult: any = await basicApiCall('/article/extract-enhanced', {
            url: result.url,
            phase: 'get-images',
            connectUrl: result.connectUrl
          });
          
          const backgroundImages = imageResult.images || [];
          console.log(`${backgroundImages.length} images trouvées en arrière-plan pour ${result.url}`);
          console.log("backgroundImages", backgroundImages);
          
          if (backgroundImages.length > 0) {
            // Extract image URLs from BrowserBase results
            const imageUrls = backgroundImages
              .map((img: any) => img.src)
              .filter(Boolean) as string[];
            
            // Remove duplicate URLs
            const uniqueImageUrls: string[] = Array.from(new Set(imageUrls));
            console.log(`Images filtrées: ${imageUrls.length} -> ${uniqueImageUrls.length} (${imageUrls.length - uniqueImageUrls.length} doublons supprimés)`);
            
            // Transform and save images
            const imagesMedia = await extractedImagesToMedia(uniqueImageUrls);
            console.log("Images BrowserBase arrière-plan enregistrées:", imagesMedia);
            
            // Update store with current images + new background images
            const existingUrls = new Set(extractedImagesMedia.map((img: any) => img.link));
            const newImages = imagesMedia.filter((img: any) => !existingUrls.has(img.link));
            setExtractedImagesMedia([...extractedImagesMedia, ...newImages]);

            analyzeAndFilterExtractedImages(uniqueImageUrls, (filteredImages: IMedia[]) => {
              // Update store with current images + new filtered background images
              const existingUrls = new Set(extractedImagesMedia.map((img: IMedia) => img.image?.link).filter(Boolean));
              const newFilteredImages = filteredImages.filter((img: IMedia) => !existingUrls.has(img.image?.link));
              setExtractedImagesMedia([...extractedImagesMedia, ...newFilteredImages]);
            });
          }
        } catch (error) {
          console.error(`Erreur lors de l'extraction d'images en arrière-plan pour ${result.url}:`, error);
        }
      });
    }
    
    // Fallback: use AI extraction on markdown content if no background processing
    const urlsWithoutBackground = successfulResults.filter(r => !r.hasBackgroundProcessing);
    if (urlsWithoutBackground.length > 0) {
      console.log("Utilisation du fallback AI pour les URLs sans traitement arrière-plan...");
      const imageExtractionPromises = urlsWithoutBackground.map(async (result) => {
        try {
          const imageResult = await basicApiCall<ExtractedImagesResponse>('/ai/extract-images', {
            markdownContent: result.markdown
          });
          return imageResult.relevantImages || [];
        } catch (error) {
          console.error(`Erreur lors de l'extraction AI pour ${result.url}:`, error);
          return [];
        }
      });
      
      Promise.all(imageExtractionPromises).then(results => {
        const fallbackImages = results.flat();
        if (fallbackImages.length > 0) {
          extractedImagesToMedia(fallbackImages)
            .then(imagesMedia => {
              setExtractedImagesMedia([...extractedImagesMedia, ...imagesMedia]);
              analyzeAndFilterExtractedImages(fallbackImages, (filteredImages: IMedia[]) => {
                setExtractedImagesMedia(filteredImages);
              });
            })
            .catch(error => {
              console.error("Erreur lors de l'enregistrement des images fallback:", error);
            });
        }
      });
    }
  }

  return successfulResults;
} 