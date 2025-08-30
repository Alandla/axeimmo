import { IMedia } from '../types/video'

export async function transformUrlsToMedia(urls: string[], usage: 'media' | 'voice' | 'avatar', source?: string): Promise<IMedia[]> {
  const mediaPromises = urls.map(async (url, index) => {
    // Déterminer le type de média basé sur l'extension
    const extension = url.split('.').pop()?.toLowerCase();
    let type: 'image' | 'video' | 'audio' = 'image';
    
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(extension || '')) {
      type = 'video';
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension || '')) {
      type = 'audio';
    }

    const media: IMedia = {
      id: `api-${usage}-${Date.now()}-${index}`,
      type,
      usage,
      name: `${usage}-${index + 1}`,
      createdAt: new Date()
    };

    // Ajouter les propriétés spécifiques selon le type
    if (type === 'video') {
      media.video = {
        id: media.id!,
        link: url,
        file_type: extension || 'mp4',
        size: 0, // Sera mis à jour lors du traitement
        quality: 'hd'
      };
    } else if (type === 'image') {
      media.image = {
        id: media.id!,
        link: url,
        size: 0 // Sera mis à jour lors du traitement
      };
    } else if (type === 'audio') {
      media.audio = {
        id: media.id!,
        link: url
      };
    }

    return media;
  });

  return Promise.all(mediaPromises);
}

/**
 * Valider qu'une URL est accessible et retourne le type de contenu
 */
export async function validateMediaUrl(url: string): Promise<{ valid: boolean; type?: 'image' | 'video' | 'audio'; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type');
    
    if (!contentType) {
      return { valid: false, error: 'No content type' };
    }

    if (contentType.startsWith('image/')) {
      return { valid: true, type: 'image' };
    } else if (contentType.startsWith('video/')) {
      return { valid: true, type: 'video' };
    } else if (contentType.startsWith('audio/')) {
      return { valid: true, type: 'audio' };
    } else {
      return { valid: false, error: 'Unsupported content type' };
    }
  } catch (error) {
    return { valid: false, error: 'Network error' };
  }
}