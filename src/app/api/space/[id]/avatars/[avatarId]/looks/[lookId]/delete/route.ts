import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { deleteFromS3, getKeyFromUrl } from "@/src/lib/r2";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; avatarId: string; lookId: string } }
) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userIsInSpace: boolean = await isUserInSpace(
      session.user.id,
      params.id
    );
    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space: any = await getSpaceById(params.id);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const avatar = space.avatars?.find((a: any) => a.id === params.avatarId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const lookIndex = avatar.looks?.findIndex((l: any) => l.id === params.lookId);
    if (lookIndex === -1 || lookIndex === undefined) {
      return NextResponse.json({ error: "Look not found" }, { status: 404 });
    }

    const look = avatar.looks[lookIndex];

    // Build deletion promises for look assets and run in parallel
    const deletionPromises: Promise<any>[] = [];

    if (look.thumbnail) {
      deletionPromises.push(
        (async () => {
          try {
            const key = await getKeyFromUrl(look.thumbnail);
            await deleteFromS3(key, 'avatars');
          } catch (error) {
            console.error("Error deleting look thumbnail from S3:", error);
          }
        })()
      );
    }

    if (look.videoUrl) {
      deletionPromises.push(
        (async () => {
          try {
            const key = await getKeyFromUrl(look.videoUrl);
            await deleteFromS3(key, 'avatars');
          } catch (error) {
            console.error("Error deleting look video from S3:", error);
          }
        })()
      );
    }

    if (deletionPromises.length > 0) {
      await Promise.allSettled(deletionPromises);
    }

    // Remove look from avatar
    avatar.looks.splice(lookIndex, 1);

    // If this was the avatar's thumbnail, update it to the first remaining look or null
    if (avatar.thumbnail === look.thumbnail) {
      avatar.thumbnail = avatar.looks.length > 0 ? avatar.looks[0].thumbnail : null;
    }

    await space.save();

    return NextResponse.json({ data: "Look deleted successfully" });
  } catch (error) {
    console.error("Error deleting look:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}


