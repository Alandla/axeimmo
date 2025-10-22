import axios from 'axios';
import { Avatar, AvatarLook } from '../types/avatar';
import { VideoFormat } from '../types/video';

/**
 * Calcule l'offset X en fonction de la position de l'avatar
 * @param position - Position de l'avatar (généralement entre 0 et 100)
 * @returns Valeur de l'offset X
 */
function calculateXOffset(position: number): number {
  // La position 50 correspond à x = 0
  // Pour chaque unité de position au-dessus de 50, on soustrait 0.01
  // Pour chaque unité de position en-dessous de 50, on ajoute 0.01
  return (50 - position) * 0.01;
}

/**
 * Lance la génération d'une vidéo avec un avatar et un fichier audio
 * @param avatar - L'avatar
 * @param audioUrl - L'URL du fichier audio à utiliser
 * @param videoFormat - Le format de la vidéo (vertical, horizontal, etc.)
 * @returns La réponse de l'API contenant l'ID de la vidéo générée
 */
export async function generateAvatarVideo(avatar: AvatarLook, audioUrl: string, videoFormat: VideoFormat = 'vertical') {
  // Determine if we're dealing with horizontal format and horizontal avatar
  const isHorizontalFormatAndAvatar = videoFormat === 'horizontal' && avatar.format !== 'vertical';
  
  // Calculate xOffset based on conditions
  let xOffset = 0;
  if (!isHorizontalFormatAndAvatar && avatar.format !== 'vertical') {
    // For other cases: use calculated offset
    xOffset = calculateXOffset(avatar.settings?.position ?? 50);
  }

  // Calculate scale based on conditions
  let scale: number;
  if (avatar.settings?.scale) {
    // Use custom scale if provided
    scale = avatar.settings.scale;
  } else if (isHorizontalFormatAndAvatar || avatar.format === 'vertical') {
    // For horizontal format + horizontal avatar OR vertical avatar: scale = 1
    scale = 1;
  } else {
    // For other cases: scale = 3.17
    scale = 3.17;
  }

  // Calculate dimensions based on video format
  const dimensions = videoFormat === 'horizontal' && avatar.format !== 'vertical'
    ? { width: 1920, height: 1080 }
    : { width: 1080, height: 1920 };

  const response = await axios.post(
    'https://api.heygen.com/v2/video/generate',
    {
      video_inputs: [
        {
          character: {
            type: avatar.settings?.heygenType || 'avatar',
            ...(avatar.settings?.heygenType === 'talking_photo' ? { talking_photo_id: avatar.id } : { avatar_id: avatar.id }),
            scale: scale,
            offset: {
              x: xOffset,
              y: 0.0
            }
          },
          voice: {
            type: "audio",
            audio_url: audioUrl
          }
        }
      ],
      caption: false,
      dimension: dimensions
    },
    {
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Récupère les détails d'une vidéo générée
 * @param videoId - L'ID de la vidéo à récupérer
 * @returns Les détails de la vidéo (statut, URL, etc.)
 */
export async function getVideoDetails(videoId: string) {
  const response = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: {
      'X-Api-Key': process.env.HEYGEN_API_KEY,
    },
  });

  return response.data;
}

/**
 * Upload une image sur Heygen et récupère l'image_key
 * @param imageUrl - L'URL de l'image à uploader
 * @returns L'image_key de l'image uploadée
 */
export async function uploadImageToHeygen(imageUrl: string): Promise<string> {
  return 'image/5a25acc48f51407fa40818dc2e0c11bf/original'
  // Download image from URL
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(imageResponse.data);
  // Detect content type from response or URL
  let contentType = imageResponse.headers['content-type'] || 'image/jpeg';
  
  // If content type is not available, try to detect from URL extension
  if (!contentType.startsWith('image/')) {
    const urlLower = imageUrl.toLowerCase();
    if (urlLower.endsWith('.png')) {
      contentType = 'image/png';
    } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (urlLower.endsWith('.webp')) {
      contentType = 'image/webp';
    } else {
      // Default to jpeg
      contentType = 'image/jpeg';
    }
  }
  
  try {
    // Upload to Heygen
    const response = await axios.post(
      'https://upload.heygen.com/v1/asset',
      imageBuffer,
      {
        headers: {
          'X-Api-Key': process.env.HEYGEN_API_KEY,
          'Content-Type': contentType,
        },
      }
    );

    return response.data.data.image_key;
  } catch (error: any) {
    // Check if it's a content type mismatch error
    if (error.response?.data?.code === 400543) {
      const errorMessage = error.response.data.message;
      // Extract expected content type from error message
      const match = errorMessage.match(/!=\s*([^\s]+)/);
      
      if (match && match[1]) {
        const expectedContentType = match[1];
        console.log(`Retrying upload with correct content type: ${expectedContentType}`);
        
        // Retry with the correct content type
        const retryResponse = await axios.post(
          'https://upload.heygen.com/v1/asset',
          imageBuffer,
          {
            headers: {
              'X-Api-Key': process.env.HEYGEN_API_KEY,
              'Content-Type': expectedContentType,
            },
          }
        );

        return retryResponse.data.data.image_key;
      }
    }
    
    // Re-throw the error if it's not a content type mismatch or retry failed
    throw error;
  }
}

/**
 * Génère une vidéo avatar avec le modèle Avatar IV
 * @param imageKey - La clé de l'image uploadée sur Heygen
 * @param audioUrl - L'URL du fichier audio
 * @param videoFormat - Le format de la vidéo (vertical, horizontal)
 * @param title - Le titre de la vidéo
 * @returns La réponse de l'API contenant l'ID de la vidéo générée
 */
export async function generateAvatarIVVideo(
  imageKey: string,
  audioUrl: string,
  videoFormat: VideoFormat = 'vertical',
  title: string = 'Avatar IV Video'
) {
  const videoOrientation = videoFormat === 'vertical' ? 'portrait' : 'landscape';

  const response = await axios.post(
    'https://api.heygen.com/v2/video/av4/generate',
    {
      video_title: title,
      video_orientation: videoOrientation,
      fit: 'cover',
      image_key: imageKey,
      audio_url: audioUrl
    },
    {
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
