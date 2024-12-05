import axios from 'axios';

/**
 * Lance la génération d'une vidéo avec un avatar et un fichier audio
 * @param avatarId - L'ID de l'avatar Heygen
 * @param audioUrl - L'URL du fichier audio à utiliser
 * @returns La réponse de l'API contenant l'ID de la vidéo générée
 */
export async function generateAvatarVideo(avatarId: string, audioUrl: string) {
  const response = await axios.post(
    'https://api.heygen.com/v2/video/generate',
    {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal"
          },
          voice: {
            type: "audio",
            audio_url: audioUrl
          }
        }
      ],
      caption: false,
      dimension: {
        width: 1280,
        height: 720
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
