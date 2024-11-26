import connectMongo from '../lib/mongoose';
import Video from '../models/Video';
import { IVideo } from '../types/video';

export const getVideoById = async (id: string): Promise<IVideo | null> => {
  try {
    await connectMongo();
    const video = await Video.findById(id);
    return video?.toJSON();
  } catch (error: any) {
    throw new Error(`Erreur lors de la récupération de la vidéo: ${error.message}`);
  }
}

export const getVideosBySpaceId = async (spaceId: string): Promise<IVideo[]> => {
  try {
    await connectMongo();
    const videos = await Video.find({ spaceId });
    return videos.map(video => video.toJSON());
  } catch (error: any) {
    throw new Error(`Erreur lors de la récupération des vidéos: ${error.message}`);
  }
}

export const updateVideo = async (videoData: IVideo): Promise<IVideo> => {
  try {
    await connectMongo();
    const video = await Video.findByIdAndUpdate(videoData.id, videoData, { new: true });
    return video?.toJSON();
  } catch (error: any) {
    throw new Error(`Erreur lors de la mise à jour de la vidéo: ${error.message}`);
  }
}

export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    await connectMongo();
    await Video.findByIdAndDelete(videoId);
  } catch (error: any) {
    throw new Error(`Erreur lors de la suppression de la vidéo: ${error.message}`);
  }
}

export const createVideo = async (videoData: IVideo): Promise<IVideo> => {
  try {
    await connectMongo();
    const video = new Video(videoData);
    const savedVideo = await video.save();
    return savedVideo.toJSON();
  } catch (error: any) {
    throw new Error(`Erreur lors de la création de la vidéo: ${error.message}`);
  }
};
