import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";

export async function PATCH(
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

    const body = await req.json().catch(() => ({}));
    const name: string | undefined = body?.name;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const avatar = space.avatars?.find((a: any) => a.id === params.avatarId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const look = avatar.looks?.find((l: any) => l.id === params.lookId);
    if (!look) {
      return NextResponse.json({ error: "Look not found" }, { status: 404 });
    }

    look.name = name.trim();

    await space.save();

    return NextResponse.json({ data: look }, { status: 200 });
  } catch (error) {
    console.error("Error updating look:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}


