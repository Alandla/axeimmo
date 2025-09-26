import { executeWithRetry } from "../lib/db";
import Video from "../models/Video";
import { IVideo } from "../types/video";
import mongoose from "mongoose";

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

export interface VideoFilters {
  duration?: {
    min?: number;
    max?: number;
    isNot?: boolean;
  };
  createdBy?: {
    userIds: string[];
    isNot?: boolean;
  };
  hasAvatar?: {
    value: boolean;
    isNot?: boolean;
  };
  isOutdated?: {
    value: boolean;
    isNot?: boolean;
  };
  createdDate?: {
    startDate?: Date;
    endDate?: Date;
    isNot?: boolean;
  };
}

export const getVideosBySpaceId = async (
  spaceId: string, 
  page: number = 1, 
  limit: number = 20,
  filters?: VideoFilters
): Promise<{ videos: IVideo[], totalCount: number, currentPage: number, totalPages: number }> => {
  try {
    return await executeWithRetry(async () => {
      const skip = (page - 1) * limit;
      
      // Projection pour ne récupérer que les champs nécessaires
      const projection = {
        _id: 1,
        state: 1,
        history: 1,
        createdAt: 1,
        updatedAt: 1,
        title: 1,
        settings: 1,
        spaceId: 1,
        'video.metadata': 1,
        'video.thumbnail': 1,
        'video.avatar': 1,
        'video.format': 1,
        'video.sequences': { $slice: 1 }, // Ne récupérer que le premier élément du tableau
        'video.audio.voices': 1
      };
      
      // Construction du filtre MongoDB
      const mongoQuery: any = { 
        spaceId, 
        archived: { $ne: true } 
      };

      // Appliquer les filtres
      if (filters) {
        // Filtre par durée (utiliser audio_duration)
        if (filters.duration) {
          const durationFilter: any = {};
          if (filters.duration.min !== undefined) {
            durationFilter.$gte = filters.duration.min;
          }
          if (filters.duration.max !== undefined) {
            durationFilter.$lte = filters.duration.max;
          }
          if (Object.keys(durationFilter).length > 0) {
            if (filters.duration.isNot) {
              mongoQuery['video.metadata.audio_duration'] = { $not: durationFilter };
            } else {
              mongoQuery['video.metadata.audio_duration'] = durationFilter;
            }
          }
        }

        // Filtre par avatar
        if (filters.hasAvatar !== undefined) {
          const hasAvatarCondition = filters.hasAvatar.value 
            ? { $exists: true, $ne: null } 
            : { $exists: false };
          
          if (filters.hasAvatar.isNot) {
            // Inverser la condition
            mongoQuery['video.avatar'] = filters.hasAvatar.value 
              ? { $exists: false }
              : { $exists: true, $ne: null };
          } else {
            mongoQuery['video.avatar'] = hasAvatarCondition;
          }
        }

        // Filtre par statut outdated
        if (filters.isOutdated !== undefined) {
          if (filters.isOutdated.value) {
            // Vidéo outdated : pas de voices ou voices vide
            const outdatedCondition = {
              $or: [
                { "video.audio.voices": { $exists: false } },
                { "video.audio.voices": { $size: 0 } }
              ]
            };
            
            if (filters.isOutdated.isNot) {
              // NOT outdated : a des voices non vides
              mongoQuery["video.audio.voices"] = { $exists: true, $not: { $size: 0 } };
            } else {
              // IS outdated
              mongoQuery.$or = outdatedCondition.$or;
            }
          } else {
            // Vidéo non outdated : a des voices
            if (filters.isOutdated.isNot) {
              // NOT non-outdated = IS outdated
              mongoQuery.$or = [
                { "video.audio.voices": { $exists: false } },
                { "video.audio.voices": { $size: 0 } }
              ];
            } else {
              // IS non-outdated
              mongoQuery["video.audio.voices"] = { $exists: true, $not: { $size: 0 } };
            }
          }
        }

        // Filtre par date de création
        if (filters.createdDate) {
          const dateFilter: any = {};
          if (filters.createdDate.startDate) {
            dateFilter.$gte = filters.createdDate.startDate;
          }
          if (filters.createdDate.endDate) {
            dateFilter.$lte = filters.createdDate.endDate;
          }
          if (Object.keys(dateFilter).length > 0) {
            if (filters.createdDate.isNot) {
              mongoQuery.createdAt = { $not: dateFilter };
            } else {
              mongoQuery.createdAt = dateFilter;
            }
          }
        }

        // Filtre par créateur (utiliser l'historique)
        if (filters.createdBy && filters.createdBy.userIds.length > 0) {
          console.log("filters.createdBy.userIds", filters.createdBy.userIds);
          const creatorCondition = {
            $elemMatch: {
              step: 'CREATE',
              user: { $in: filters.createdBy.userIds.map(id => new mongoose.Types.ObjectId(id)) }
            }
          };
          
          if (filters.createdBy.isNot) {
            mongoQuery.history = { $not: creatorCondition };
          } else {
            mongoQuery.history = creatorCondition;
          }
        }
      }
      
      const [videos, totalCount] = await Promise.all([
        Video.find(mongoQuery, projection)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Video.countDocuments(mongoQuery)
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

export const duplicateVideo = async (videoId: string, userId: string): Promise<IVideo> => {
  try {
    return await executeWithRetry(async () => {
      // Récupérer la vidéo originale
      const originalVideo = await Video.findById(videoId);
      if (!originalVideo) {
        throw new Error('Vidéo non trouvée');
      }

      const originalData = originalVideo.toJSON();
      
      // Générer un nouveau titre avec incrément
      const baseTitle = originalData.title || 'Untitled';
      const spaceId = originalData.spaceId;
      
      // Chercher les titres existants avec le même pattern
      const titlePattern = new RegExp(`^${baseTitle.replace(/\s*\(\d+\)$/, '')}(\\s*\\(\\d+\\))?$`);
      const existingVideos = await Video.find({ 
        spaceId, 
        title: titlePattern,
        archived: { $ne: true }
      }).select('title');
      
      // Trouver le prochain numéro disponible
      let maxNumber = 0;
      const cleanBaseTitle = baseTitle.replace(/\s*\(\d+\)$/, '');
      
      existingVideos.forEach(video => {
        const match = video.title.match(/\((\d+)\)$/);
        if (match) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        } else if (video.title === cleanBaseTitle) {
          // Si on trouve le titre de base sans numéro, le prochain sera (1)
          maxNumber = Math.max(maxNumber, 0);
        }
      });
      
      const newTitle = `${cleanBaseTitle} (${maxNumber + 1})`;
      
      // Créer la nouvelle vidéo
      const duplicatedData = {
        ...originalData,
        _id: undefined,
        id: undefined,
        title: newTitle,
        createdAt: undefined,
        updatedAt: undefined,
        history: [{
          step: 'CREATE',
          user: new mongoose.Types.ObjectId(userId),
          date: new Date()
        }]
      };
      
      const newVideo = new Video(duplicatedData);
      const savedVideo = await newVideo.save();
      return savedVideo.toJSON();
    });
  } catch (error: any) {
    throw new Error(`Erreur lors de la duplication de la vidéo: ${error.message}`);
  }
};
