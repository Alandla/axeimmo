import { imageAnalysisRun } from "@/src/lib/workflowai";
import { updateMedia } from "@/src/dao/spaceDao";
import { tasks } from "@trigger.dev/sdk/v3";
import { IMediaSpace } from "@/src/types/space";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";

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
      let imageDescription;
      
      try {
        const result = await imageAnalysisRun(mediaUrl);
        imageDescription = result.description;
      } catch (error) {
        console.error("Error analyzing image with original URL, uploading to R2 and retrying:", error);
        
        try {
          // Upload image to R2 and retry analysis
          const fileName = `image-${Date.now()}`;
          const r2Url = await uploadImageFromUrlToS3(mediaUrl, "medias-users", fileName);
          
          const result = await imageAnalysisRun(r2Url);
          imageDescription = result.description;
        } catch (retryError) {
          console.error("Error analyzing image even after uploading to R2:", retryError);
          return;
        }
      }
      
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