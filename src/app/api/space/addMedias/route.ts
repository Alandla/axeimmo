import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { addMediasToSpace } from '@/src/dao/spaceDao';
import { isUserInSpace } from '@/src/dao/userDao';
import { IMediaSpace } from '@/src/types/space';
import { getSpaceById } from '@/src/dao/spaceDao';
import { storageLimit } from '@/src/config/plan.config';
import { PlanName } from '@/src/types/enums';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/addMedias by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, medias } = params;

  try {
    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space = await getSpaceById(spaceId);
    
    let additionalStorageBytes = 0;
    for (const mediaSpace of medias) {
      const media = mediaSpace.media;
      if (media.type === 'image' && media.image && media.image.size) {
        additionalStorageBytes += media.image.size;
      } else if (media.type === 'video' && media.video && media.video.size) {
        additionalStorageBytes += media.video.size;
      }
    }

    console.log("additionalStorageBytes: ", additionalStorageBytes);
    
    const currentStorage = space.usedStorageBytes || 0;
    
    const planName = space.plan?.name as PlanName;
    const planLimit = space.plan?.storageLimit || 
                     (planName ? storageLimit[planName] : storageLimit[PlanName.FREE]);

    if (currentStorage + additionalStorageBytes > planLimit) {
      return NextResponse.json({ 
        error: "Storage limit exceeded", 
        details: {
          currentStorage,
          additionalStorage: additionalStorageBytes,
          totalRequired: currentStorage + additionalStorageBytes,
          limit: planLimit
        }
      }, { status: 400 });
    }

    const addedMedias: IMediaSpace[] = await addMediasToSpace(spaceId, medias);

    return NextResponse.json({ data: { addedMedias, usedStorageBytes: currentStorage + additionalStorageBytes } })
  } catch (error) {
    console.error('Error adding medias:', error)
    return NextResponse.json({ error: 'Error adding medias' }, { status: 500 })
  }
}