/**
 * Utility functions for client-side image resizing
 */

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
  const finalImageUrl = imageUrl.startsWith('https://media.hoox.video/') && 
                        window.location.hostname === 'localhost'
    ? `/api/media/proxy-image?url=${encodeURIComponent(imageUrl)}`
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

