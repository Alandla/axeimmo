import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { deleteFromS3, getKeyFromUrl } from "@/src/lib/r2";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; avatarId: string } }
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

    const avatarIndex = space.avatars?.findIndex((a: any) => a.id === params.avatarId);
    if (avatarIndex === -1 || avatarIndex === undefined) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const avatar = space.avatars[avatarIndex];

    // Build deletion promises for avatar thumbnail and all looks assets, then run in parallel
    const deletionPromises: Promise<any>[] = [];

    if (avatar.thumbnail) {
      deletionPromises.push(
        (async () => {
          try {
            const key = await getKeyFromUrl(avatar.thumbnail);
            await deleteFromS3(key, 'avatars');
          } catch (error) {
            console.error("Error deleting avatar thumbnail from S3:", error);
          }
        })()
      );
    }

    if (avatar.looks && Array.isArray(avatar.looks)) {
      for (const look of avatar.looks) {
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
      }
    }

    if (deletionPromises.length > 0) {
      await Promise.allSettled(deletionPromises);
    }

    // Remove avatar from space
    space.avatars.splice(avatarIndex, 1);
    await space.save();

    return NextResponse.json({ data: "Avatar deleted successfully" });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}


