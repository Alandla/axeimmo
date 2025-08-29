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
