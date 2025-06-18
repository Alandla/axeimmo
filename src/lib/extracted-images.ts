import { parseMedia } from '@remotion/media-parser';
import { webReader } from '@remotion/media-parser/web';
import { IMedia } from '../types/video';

/**
 * Transform extracted image URLs into IMedia format
 * Uses Remotion Media Parser to get image metadata
 * 
 * @example
 * ```typescript
 * const imageUrls = [
 *   'https://example.com/image1.jpg',
 *   'https://example.com/image2.png'
 * ];
 * 
 * const mediaList = await extractedImagesToMedia(imageUrls);
 * console.log(mediaList); // Array of IMedia objects with metadata
 * ```
 */
export async function extractedImagesToMedia(urls: string[]): Promise<IMedia[]> {
  return Promise.all(urls.map(url => extractedImageToMedia(url)));
}

/**
 * Transform a single extracted image URL into IMedia format
 */
export async function extractedImageToMedia(url: string): Promise<IMedia> {
  try {
    const metadata = await parseMedia({
      src: url,
      reader: webReader,
      fields: {
        width: true,
        height: true,
        size: true,
      },
    });
    
    return {
      type: 'image',
      usage: 'media',
      name: `Extracted Image - ${Date.now()}`,
      source: 'extracted', // Mark as extracted image
      image: {
        id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        link: url,
        width: metadata?.width || 1920,
        height: metadata?.height || 1080,
        size: metadata?.size || 0
      }
    };
  } catch (error) {
    console.error('Error getting metadata for extracted image:', error);
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
      size: 0
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