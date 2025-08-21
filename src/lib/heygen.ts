import axios from 'axios';
import { Avatar, AvatarLook } from '../types/avatar';

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
 * @returns La réponse de l'API contenant l'ID de la vidéo générée
 */
export async function generateAvatarVideo(avatar: AvatarLook, audioUrl: string) {
  const xOffset = avatar.format === 'vertical' ? 0 : calculateXOffset(avatar.settings?.position ?? 50);

  const response = await axios.post(
    'https://api.heygen.com/v2/video/generate',
    {
      video_inputs: [
        {
          character: {
            type: avatar.settings?.heygenType || 'avatar',
            ...(avatar.settings?.heygenType === 'talking_photo' ? { talking_photo_id: avatar.id } : { avatar_id: avatar.id }),
            scale: avatar.settings?.scale ?? (avatar.format === 'vertical' ? 1 : 3.17),
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
      dimension: {
        width: 1080,
        height: 1920
      }
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
