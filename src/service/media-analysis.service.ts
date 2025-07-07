import { imageAnalysisRun } from "@/src/lib/workflowai";
import { updateMedia } from "@/src/dao/spaceDao";
import { tasks } from "@trigger.dev/sdk/v3";
import { IMediaSpace } from "@/src/types/space";

export async function analyzeMediaInBackground(mediaSpace: IMediaSpace, spaceId: string) {
  try {
    let description;
    const media = mediaSpace.media;
    const mediaId = mediaSpace.id;
    
    // Obtenir l'URL du média
    const mediaUrl = media.type === 'video' 
      ? media.video?.link 
      : media.image?.link;
      
    if (!mediaUrl || !mediaId) {
      console.error("Media not found", { mediaId, type: media.type });
      return;
    }

    if (media.type === "video") {
      const response = await tasks.triggerAndPoll("analyze-video", { 
        videoUrl: mediaUrl, 
        mediaId 
      });

      const result = response.output || {};
      
      if (result.descriptions && result.descriptions.length > 0) {
        const updatedSpaceMedia = {
            ...media,
            _id: media.id,
            description: result.descriptions,
            video: {
              ...media.video,
              frames: result.frames || [],
              durationInSeconds: result.durationInSeconds
            }
        }

        await updateMedia(spaceId, mediaId, updatedSpaceMedia);
      }
    } else if (media.type === "image") {
      const { description: imageDescription } = await imageAnalysisRun(mediaUrl);
      
      if (imageDescription) {
        description = [{
          start: 0,
          text: imageDescription
        }];

        const updatedSpaceMedia = {
            ...media,
            _id: media.id,
            description: description
        }
        
        await updateMedia(spaceId, mediaId, updatedSpaceMedia);
      }
    } else {
      console.error("Media type not supported", media.type);
    }
  } catch (error) {
    console.error("Error analyzing media:", error);
  }
} 