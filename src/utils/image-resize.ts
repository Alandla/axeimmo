import axios from "axios";

// Size limits for different services (in bytes)
export const SERVICE_SIZE_LIMITS = {
  KLING: 10485760, // 10MB
  OMNIHUMAN: 5242880, // 5MB
  VEO3: 10485760, // 10MB (assuming same as Kling)
} as const;

export interface ResizeImageOptions {
  maxFileSize?: number; // in bytes, default 10MB (Kling limit)
  quality?: number; // JPEG quality 0-1, default 0.8
  format?: 'jpeg' | 'webp'; // output format, default 'webp'
  maxWidth?: number; // max width in pixels
  maxHeight?: number; // max height in pixels
}

export interface ResizeResult {
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  wasResized: boolean;
}

/**
 * Obtient la taille d'une image à partir de son URL sans la télécharger entièrement
 * @param imageUrl URL de l'image
 * @returns Taille du fichier en bytes
 */
export async function getImageFileSize(imageUrl: string): Promise<number> {
  try {
    const response = await axios.head(imageUrl);
    const contentLength = response.headers['content-length'];
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch (error) {
    console.error("Error getting image file size:", error);
    return 0;
  }
}

/**
 * Check if an image needs to be resized based on file size
 */
export function shouldResizeImage(fileSize: number, maxSize: number = 10485760): boolean {
  return fileSize > maxSize;
}

/**
 * Resize an image from URL to reduce file size
 */
export async function resizeImageFromUrl(
  imageUrl: string, 
  filename: string,
  options: ResizeImageOptions = {}
): Promise<ResizeResult> {
  const {
    maxFileSize = 10485760, // 10MB
    quality = 0.99,
    format = 'webp',
    maxWidth = 1920,
    maxHeight = 1080
  } = options;

  // Use proxy for media.hoox.video URLs to avoid CORS issues in development
  const finalImageUrl = imageUrl.startsWith('https://media.hoox.video/') ? `/api/media/proxy-image?url=${encodeURIComponent(imageUrl)}`
    : imageUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for external URLs that are not proxied
    if (imageUrl.startsWith('http') && 
        !imageUrl.includes(window.location.hostname) && 
        !finalImageUrl.startsWith('/api/')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        let { width: newWidth, height: newHeight } = calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw the resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Try different quality levels until we get under the file size limit
        const tryWithQuality = async (targetQuality: number): Promise<Blob | null> => {
          return new Promise((resolveBlob) => {
            canvas.toBlob(
              (blob) => {
                resolveBlob(blob);
              },
              `image/${format}`,
              targetQuality
            );
          });
        };

        // Reduce quality iteratively until we meet the size requirement
        const optimizeImageSize = async () => {
          let currentQuality = quality;
          let finalBlob: Blob | null = null;
          
          // Try quality levels from high to low
          const qualityLevels = [currentQuality];
          while (currentQuality > 0.3) {
            currentQuality -= 0.1;
            qualityLevels.push(Math.max(currentQuality, 0.3));
          }
          
          for (const qualityLevel of qualityLevels) {
            const blob = await tryWithQuality(qualityLevel);
            if (blob) {
              finalBlob = blob;
              if (blob.size <= maxFileSize) {
                break; // Found acceptable size
              }
            }
          }
          
          if (!finalBlob) {
            reject(new Error('Failed to create optimized blob'));
            return;
          }
          
          const file = new File([finalBlob], filename, { type: `image/${format}` });
          const url = URL.createObjectURL(file);
          
          resolve({
            file,
            url,
            width: newWidth,
            height: newHeight,
            size: finalBlob.size,
            wasResized: true
          });
        };

        optimizeImageSize().catch(reject);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = finalImageUrl;
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  // Scale down if too wide
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }
  
  // Scale down if too tall
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
}

/**
 * Try to optimize an image by testing different Vercel widths until we find one that meets the size limit
 * This function tests widths progressively from largest to smallest until the image is under the size limit
 * 
 * @param imageUrl - The original image URL
 * @param maxFileSize - Maximum file size in bytes (default: 10MB for Kling)
 * @param originalWidth - Original image width to determine starting point (optional)
 * @returns Promise<string> - The optimized image URL that meets the size requirement
 */
export async function optimizeImageForSize(
  imageUrl: string,
  maxFileSize: number = 10485760, // 10MB
  originalWidth?: number
): Promise<string> {
  // If it's already a Vercel optimized URL, return as is
  if (imageUrl.includes('/_next/image?')) {
    return imageUrl;
  }

  // Vercel predefined widths (in descending order)
  const VERCEL_WIDTHS = [2048, 1920, 1200, 1080, 828, 750, 640];
  
  // Filter widths to only test those smaller than or equal to original width
  const availableWidths = originalWidth 
    ? VERCEL_WIDTHS.filter(w => w <= originalWidth)
    : VERCEL_WIDTHS;

  if (availableWidths.length === 0) {
    availableWidths.push(1080);
  }

  // Always use production URL for consistency
  const baseUrl = 'https://app.hoox.video';

  // Test each width from largest to smallest
  for (const width of availableWidths) {
    const optimizedUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(imageUrl)}&w=${width}&q=100`;
    
    try {
      // Check the file size of this optimized version
      const response = await fetch(optimizedUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (contentLength) {
        const fileSize = parseInt(contentLength, 10);
        console.log(`Testing width ${width}: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        
        if (fileSize <= maxFileSize) {
          console.log(`Found suitable width ${width} for image optimization`);
          return optimizedUrl;
        }
      }
    } catch (error) {
      console.error(`Error testing width ${width}:`, error);
      // Continue to next width
    }
  }
  
  // If all widths failed, return the smallest one as last resort
  const fallbackWidth = availableWidths[availableWidths.length - 1] || 640;
  const fallbackUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(imageUrl)}&w=${fallbackWidth}&q=100`;
  console.log(`Using fallback width ${fallbackWidth} for image optimization`);
  
  return fallbackUrl;
}

/**
 * Generic function to check and resize an image if it exceeds the specified size limit
 * This function can be used by any service (Kling, OmniHuman, etc.) that has size constraints
 * 
 * @param imageUrl - URL of the image to check
 * @param maxFileSize - Maximum file size in bytes
 * @param originalWidth - Original image width (optional, for progressive optimization)
 * @param fileSize - File size in bytes (optional, will be detected if not provided)
 * @returns Promise<string> - The image URL (resized if necessary)
 */
export async function checkAndResizeImageIfNeeded(
  imageUrl: string,
  maxFileSize: number,
  originalWidth?: number,
  fileSize?: number,
): Promise<string> {
  // If file size is not provided, try to detect it
  if (!fileSize) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      fileSize = contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      return imageUrl;
    }
  }
  
  if (fileSize <= maxFileSize) {
    return imageUrl;
  }
  
  return await optimizeImageForSize(imageUrl, maxFileSize, originalWidth);
}
