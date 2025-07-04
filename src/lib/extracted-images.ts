import { IMedia } from '../types/video';
import { getImageDimensions } from '../service/upload.service';

/**
 * Transform extracted image URLs into IMedia format (fast version without metadata analysis)
 * Returns images immediately for quick store update
 * 
 * @param urls - Array of image URLs to process
 * @returns Promise<IMedia[]> - Array of IMedia objects with default dimensions
 */
export async function extractedImagesToMedia(urls: string[]): Promise<IMedia[]> {
  return Promise.all(urls.map(url => extractedImageToMediaBasic(url)));
}

/**
 * Analyze and filter extracted images with Media Parser in background
 * Gets real dimensions and filters out images smaller than 200x200
 * 
 * @param urls - Array of image URLs to analyze
 * @param updateCallback - Callback function to update the store with filtered images
 * 
 * @example
 * ```typescript
 * const imageUrls = ['https://example.com/image1.jpg'];
 * 
 * // This will analyze in background and call updateCallback with filtered results
 * analyzeAndFilterExtractedImages(imageUrls, (filteredImages) => {
 *   setExtractedImagesMedia(filteredImages);
 * });
 * ```
 */
export async function analyzeAndFilterExtractedImages(
  urls: string[], 
  updateCallback: (filteredImages: IMedia[]) => void
): Promise<void> {
  console.log(`[EXTRACTED_IMAGES] Starting background analysis of ${urls.length} images...`);
  
  try {
    const results = await Promise.all(
      urls.map(async (url, index) => {
        try {
          console.log(`[EXTRACTED_IMAGES] Analyzing image ${index + 1}/${urls.length}: ${url}`);
          return await extractedImageToMediaWithAnalysis(url);
        } catch (error) {
          console.error(`[EXTRACTED_IMAGES] Error analyzing image ${index + 1}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null results and images that are too small
    const validImages = results.filter((media: IMedia | null): media is IMedia => {
      if (!media) return false;
      
      const width = media.image?.width || 0;
      const height = media.image?.height || 0;
      const isLargeEnough = width >= 300 && height >= 300;
      
      if (!isLargeEnough) {
        console.log(`[EXTRACTED_IMAGES] Filtering out small image: ${width}x${height} - ${media.image?.link}`);
      }
      
      return isLargeEnough;
    });
    
    console.log(`[EXTRACTED_IMAGES] Background analysis complete. Filtered ${results.length - validImages.length} small images. Keeping ${validImages.length} images.`);
    
    // Update the store with filtered images
    updateCallback(validImages);
  } catch (error) {
    console.error('[EXTRACTED_IMAGES] Error during background analysis:', error);
  }
}

/**
 * Transform a single extracted image URL into IMedia format
 * Uses Remotion Media Parser to get accurate dimensions
 */
export async function extractedImageToMediaWithAnalysis(url: string): Promise<IMedia> {
  try {
    console.log(`[EXTRACTED_IMAGES] Getting metadata for: ${url}`);
    
    let dimensions;
    try {
      dimensions = await getImageDimensions(url);
    } catch (error) {
      console.error(`[EXTRACTED_IMAGES] Error getting metadata for ${url}:`, error);
      return extractedImageToMediaBasic(url);
    }

    if (!dimensions) {
      return extractedImageToMediaBasic(url);
    }
    
    const width = dimensions.width || 0;
    const height = dimensions.height || 0;
    
    console.log(`[EXTRACTED_IMAGES] Got dimensions: ${width}x${height} for ${url}`);
    
    return {
      type: 'image',
      usage: 'media',
      name: `Extracted Image - ${Date.now()}`,
      source: 'extracted', // Mark as extracted image
      image: {
        id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        link: url,
        width,
        height,
      }
    };
  } catch (error) {
    console.error(`[EXTRACTED_IMAGES] Error getting metadata for ${url}:`, error);
    // Fallback to basic format with default dimensions (will be filtered out if too small)
    return extractedImageToMediaBasic(url);
  }
}

/**
 * Get basic image info without using Media Parser (faster fallback)
 * This is useful when you need faster processing or when Media Parser is not available
 */
export function extractedImageToMediaBasic(url: string): IMedia {
  return {
    type: 'image',
    usage: 'media',
    name: `Extracted Image - ${Date.now()}`,
    source: 'extracted', // Mark as extracted image
    image: {
      id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      link: url,
      width: 1920,
      height: 1080,
    }
  };
}

/**
 * Transform extracted images to basic IMedia format (without metadata parsing)
 * Useful when you need faster processing or when Media Parser is not available
 */
export function extractedImagesToMediaBasic(urls: string[]): IMedia[] {
  return urls.map(url => extractedImageToMediaBasic(url));
} 