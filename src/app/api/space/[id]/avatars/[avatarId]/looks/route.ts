import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { nanoid } from "nanoid";

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const imageUrl: string | undefined = body?.imageUrl;
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const avatar = space.avatars?.find((a: any) => a.id === params.avatarId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    // Créer un nouveau look avec l'image fournie
    const lookId = nanoid();
    const look = {
      id: lookId,
      name: body?.lookName || "New Look",
      place: body?.place || "unspecified",
      tags: Array.isArray(body?.tags) ? body.tags : [],
      thumbnail: imageUrl,
      previewUrl: "",
      videoUrl: "",
      format: body?.format === "horizontal" ? "horizontal" : "vertical",
      settings: {},
    };

    avatar.looks = avatar.looks || [];
    avatar.looks.push(look as any);

    // Mettre à jour la thumbnail de l'avatar si elle n'existe pas
    if (!avatar.thumbnail) {
      avatar.thumbnail = imageUrl;
    }

    await space.save();

    return NextResponse.json({ data: look }, { status: 201 });
  } catch (error) {
    console.error("Error creating avatar look:", error);
    return NextResponse.json(
      { error: "Error creating avatar look" },
      { status: 500 }
    );
  }
}
