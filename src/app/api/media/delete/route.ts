import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { deleteMediaFromSpace } from '@/src/dao/spaceDao';
import { deleteFromS3, getKeyFromUrl } from '@/src/lib/r2';
import { IMediaSpace, ISpace } from '@/src/types/space';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/delete by user: ", session.user.id);

  const params = await req.json();

  const { media, spaceId } = params;

  try {

    const medias : IMediaSpace[] = await deleteMediaFromSpace(spaceId, media);

    if (media.image?.link) {
      const keyImage = await getKeyFromUrl(media.image.link)
      await deleteFromS3(keyImage, 'medias-users')
    }

    if (media.video?.link) {
      const keyVideo = await getKeyFromUrl(media.video.link)
      await deleteFromS3(keyVideo, 'medias-users')
    }
    
    if (media.audio?.link) {
      const keyAudio = await getKeyFromUrl(media.audio.link)
      await deleteFromS3(keyAudio, 'medias-users')
    }

    return NextResponse.json({ data: medias })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'Error deleting media' }, { status: 500 })
  }
}