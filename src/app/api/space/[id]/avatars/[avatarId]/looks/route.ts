import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { addLookToAvatar } from "@/src/dao/spaceDao";
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

    const body = await req.json().catch(() => ({}));
    const imageUrl: string | undefined = body?.imageUrl;
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
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
      createdBy: session.user.id,
      format: body?.format === "horizontal" ? "horizontal" : "vertical",
      settings: {},
    };

    // Mise à jour atomique pour éviter l'hydratation complète de `space`
    await addLookToAvatar(params.id, params.avatarId, look);

    return NextResponse.json({ data: look }, { status: 201 });
  } catch (error) {
    console.error("Error creating avatar look:", error);
    return NextResponse.json(
      { error: "Error creating avatar look" },
      { status: 500 }
    );
  }
}
