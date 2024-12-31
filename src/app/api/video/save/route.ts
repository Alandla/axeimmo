import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { getVideoById, updateVideo } from '@/src/dao/videoDao';
import { generateThumbnail } from '@/src/lib/render';
import { IVideo } from '@/src/types/video';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/video/save by user: ", session.user.id);

  const params = await req.json();

  const { video, takeThumbnail } = params;

  try {

    if (takeThumbnail) {
      const oldVideo = await getVideoById(video.id);

      if (oldVideo && hasFirstSequenceChanged(oldVideo, video)) {
        const thumbnail = await generateThumbnail(video);

        if (thumbnail && video) {
          video.costToGenerate += thumbnail.estimatedPrice.accruedSoFar;
          video.video.thumbnail = thumbnail.url;
        }
      }
    }

    await updateVideo(video);

    return NextResponse.json({ data: 'Video saved' })
  } catch (error) {
    console.error('Error saving video:', error)
    return NextResponse.json({ error: 'Error saving video' }, { status: 500 })
  }
}

// New utility function to compare first sequences
const hasFirstSequenceChanged = (oldVideo: IVideo, newVideo: IVideo): boolean => {
  if (!oldVideo.video?.sequences[0] || !newVideo.video?.sequences[0]) return false;
  
  const oldSeq = oldVideo.video.sequences[0];
  const newSeq = newVideo.video.sequences[0];
  
  // Compare relevant properties
  return JSON.stringify({
    text: oldSeq.text,
    media: oldSeq.media,
    words: oldSeq.words
  }) !== JSON.stringify({
    text: newSeq.text,
    media: newSeq.media,
    words: newSeq.words
  });
};