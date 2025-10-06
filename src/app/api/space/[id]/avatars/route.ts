import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { ISpace } from "@/src/types/space";
import { nanoid } from "nanoid";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/space/id/avatars by user: ", session.user.id);

  try {
    const userIsInSpace: boolean = await isUserInSpace(
      session.user.id,
      params.id
    );

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space: ISpace = await getSpaceById(params.id);

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json({ data: space.avatars });
  } catch (error) {
    console.error("Error getting space avatars:", error);
    return NextResponse.json(
      { error: "Error getting space avatars" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const space: ISpace = await getSpaceById(params.id);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const name: string = body?.name || "Custom Avatar";
    const gender: "male" | "female" = body?.gender || "male";
    const age: string = body?.age || "undefined";
    const tags: string[] = Array.isArray(body?.tags) ? body.tags : [];

    const avatarId = nanoid();

    const seed = Math.floor(Math.random() * 10001);

    const newAvatar: any = {
      id: avatarId,
      name,
      age,
      gender,
      seed,
      tags,
      thumbnail: "",
      looks: [],
    };

    (space as any).avatars.push(newAvatar);
    await (space as any).save();

    return NextResponse.json({ data: newAvatar });
  } catch (error) {
    console.error("Error creating space avatar:", error);
    return NextResponse.json(
      { error: "Error creating space avatar" },
      { status: 500 }
    );
  }
}
