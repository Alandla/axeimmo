import { executeWithRetry } from "../lib/db";
import Video from "../models/Video";
import { IVideo } from "../types/video";

export const getVideoById = async (id: string): Promise<IVideo | null> => {
  try {
    return await executeWithRetry(async () => {
      const video = await Video.findById(id);
      return video?.toJSON();
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de la récupération de la vidéo: ${error.message}`);
  }
}

export const getVideosBySpaceId = async (
  spaceId: string, 
  page: number = 1, 
  limit: number = 20
): Promise<{ videos: IVideo[], totalCount: number, currentPage: number, totalPages: number }> => {
  try {
    return await executeWithRetry(async () => {
      const skip = (page - 1) * limit;
      
      const [videos, totalCount] = await Promise.all([
        Video.find({ spaceId, archived: { $ne: true } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Video.countDocuments({ spaceId, archived: { $ne: true } })
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        videos: videos.map(video => video.toJSON()),
        totalCount,
        currentPage: page,
        totalPages
      };
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de la récupération des vidéos: ${error.message}`);
  }
}

export const updateVideo = async (videoData: IVideo): Promise<IVideo> => {
  try {
    return await executeWithRetry(async () => {
      const video = await Video.findByIdAndUpdate(videoData.id, videoData, { new: true });
      return video?.toJSON();
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de la mise à jour de la vidéo: ${error.message}`);
  }
}

export const updateVideoThumbnail = async (videoId: string, thumbnailUrl: string, additionalCost: number): Promise<IVideo | null> => {
  try {
    return await executeWithRetry(async () => {
      const video = await Video.findByIdAndUpdate(
        videoId,
        { 
          $set: { 
            "video.thumbnail": thumbnailUrl 
          },
          $inc: { 
            costToGenerate: additionalCost 
          }
        },
        { new: true }
      );
      return video?.toJSON();
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de la mise à jour de la vignette: ${error.message}`);
  }
}

export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    await executeWithRetry(async () => {
      await Video.findByIdAndUpdate(videoId, { archived: true });
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de l'archivage de la vidéo: ${error.message}`);
  }
}

export const createVideo = async (videoData: IVideo): Promise<IVideo> => {
  try {
    return await executeWithRetry(async () => {
      const video = new Video(videoData);
      const savedVideo = await video.save();
      return savedVideo.toJSON();
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de la création de la vidéo: ${error.message}`);
  }
};

export const getTotalVideoCountBySpaceId = async (spaceId: string): Promise<number> => {
  try {
    return await executeWithRetry(async () => {
      // Compter toutes les vidéos (y compris archivées) pour la vérification des limites
      return await Video.countDocuments({ spaceId });
    });
  } catch (error: any) {
    throw new Error(`Erreur lors du comptage des vidéos: ${error.message}`);
  }
};
