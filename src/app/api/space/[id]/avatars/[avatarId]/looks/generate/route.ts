import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { generateAvatarImage } from "@/src/lib/fal";
import { improveAvatarPrompt } from "@/src/lib/workflowai";
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
    const description: string | undefined = body?.description;
    if (!description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    const avatar = space.avatars?.find((a: any) => a.id === params.avatarId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    // 1) Crée un look pending
    const lookId = nanoid();
    const look = {
      id: lookId,
      name: body?.lookName || "Generated Look",
      place: body?.place || "unspecified",
      tags: Array.isArray(body?.tags) ? body.tags : [],
      thumbnail: "",
      previewUrl: "",
      videoUrl: "",
      format: body?.format === "horizontal" ? "horizontal" : "vertical",
      settings: {},
    };
    avatar.looks = avatar.looks || [];
    avatar.looks.push(look as any);
    await space.save();

    // 2) Améliore le prompt en utilisant les infos d'avatar (identité) et la description (scène)
    const identityHints = [
      avatar?.name ? `Name: ${avatar.name}` : undefined,
      avatar?.gender ? `Gender: ${avatar.gender}` : undefined,
      avatar?.age ? `Age: ${avatar.age}` : undefined,
      Array.isArray(avatar?.tags) && avatar.tags.length
        ? `Tags: ${avatar.tags.join(", ")}`
        : undefined,
    ]
      .filter(Boolean)
      .join(" | ");

    const basePrompt = identityHints
      ? `${description}. Keep identity consistent. ${identityHints}.`
      : `${description}. Keep identity consistent.`;
    const improved = await improveAvatarPrompt(basePrompt).catch(() => ({
      enhancedPrompt: basePrompt,
    }));

    console.log("improved.enhancedPrompt", improved.enhancedPrompt);

    // 3) Génère l'image via Fal (seed de l'avatar)
    const image = await generateAvatarImage({
      prompt: improved.enhancedPrompt || basePrompt,
      seed: avatar.seed,
    });

    // 4) Met à jour le look
    const lookRef = avatar.looks.find((l: any) => l.id === lookId);
    if (lookRef) {
      lookRef.thumbnail = image.url;
    }
    // Définir la miniature de l'avatar si absente, sans écraser une valeur existante
    if (!avatar.thumbnail) {
      avatar.thumbnail = image.url;
    }
    await space.save();

    return NextResponse.json({ data: lookRef });
  } catch (error) {
    console.error("Error generating avatar look:", error);
    return NextResponse.json(
      { error: "Error generating avatar look" },
      { status: 500 }
    );
  }
}
