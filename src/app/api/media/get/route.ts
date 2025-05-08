import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/src/lib/auth';
import { getSpaceById } from "@/src/dao/spaceDao";
import { IMediaSpace } from "@/src/types/space";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spaceId, mediaId } = await req.json();

  if (!spaceId || !mediaId) {
    return NextResponse.json(
      { error: "Parameters spaceId and mediaId are required" },
      { status: 400 }
    );
  }

  try {
    const space = await getSpaceById(spaceId);
    
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const mediaSpace = space.medias?.find((media: IMediaSpace) => media.id === mediaId);
    
    if (!mediaSpace) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mediaSpace });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while retrieving the media" },
      { status: 500 }
    );
  }
} 