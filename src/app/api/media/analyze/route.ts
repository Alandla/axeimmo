import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/src/lib/auth';
import { analyzeImage } from "@/src/lib/ai";
import { updateMedia } from "@/src/dao/spaceDao";
import { tasks } from "@trigger.dev/sdk/v3";
import { waitUntil } from "@vercel/functions";
import { IMediaSpace } from "@/src/types/space";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/analyze by user: ", session.user.id);

  const { media, spaceId } = await req.json();

  if (!media || !spaceId) {
    return NextResponse.json(
      { error: "Parameters media and spaceId are required" },
      { status: 400 }
    );
  }

  try {
    waitUntil(analyzeMediaInBackground(media, spaceId));

    return NextResponse.json({
      success: true,
      message: "Media analysis started"
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

async function analyzeMediaInBackground(mediaSpace: IMediaSpace, spaceId: string) {
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
      const imageAnalysis = await analyzeImage(mediaUrl);
      
      if (imageAnalysis && imageAnalysis.description) {
        description = [{
          start: 0,
          text: imageAnalysis.description
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