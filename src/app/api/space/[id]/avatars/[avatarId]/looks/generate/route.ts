import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { editAvatarImage } from "@/src/lib/fal";
import { improveAvatarPrompt, extractImagePromptInfo } from "@/src/lib/workflowai";
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
    const providedImages: string[] = Array.isArray(body?.images)
      ? body.images.filter((u: any) => typeof u === "string" && !!u)
      : [];
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

    // Extraire immédiatement name/place/tags à partir du prompt de base (description)
    try {
      const extractedNow = await extractImagePromptInfo(description)
      const lookRefInit = avatar.looks.find((l: any) => l.id === lookId)
      if (lookRefInit) {
        if (extractedNow.name) lookRefInit.name = extractedNow.name
        if (extractedNow.place) lookRefInit.place = extractedNow.place
        if (Array.isArray(extractedNow.tags)) lookRefInit.tags = extractedNow.tags
      }
    } catch {}
    await space.save();

    // 2) Déclencher la génération en arrière-plan (comme pour la création d'avatar)
    Promise.resolve()
      .then(async () => {
        try {
          const refreshedSpace: any = await getSpaceById(params.id);
          const avatarRef: any = refreshedSpace?.avatars?.find((a: any) => a.id === params.avatarId);
          if (!avatarRef) return;

          const identityHints = [
            avatarRef?.name ? `Name: ${avatarRef.name}` : undefined,
            avatarRef?.gender ? `Gender: ${avatarRef.gender}` : undefined,
            avatarRef?.age ? `Age: ${avatarRef.age}` : undefined,
            Array.isArray(avatarRef?.tags) && avatarRef.tags.length
              ? `Tags: ${avatarRef.tags.join(", ")}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" | ");

          const basePrompt = identityHints
            ? `${description}. Keep identity consistent. ${identityHints}.`
            : `${description}. Keep identity consistent.`;
          const improved = await improveAvatarPrompt(basePrompt).catch(() => ({ enhancedPrompt: basePrompt }));

          // Préparer les images: priorité aux images fournies, sinon thumbnail
          const candidates: string[] = (providedImages.length > 0
            ? providedImages
            : [avatarRef?.thumbnail]
          ).filter((v): v is string => typeof v === 'string' && v.length > 0);
          const imageUrls: string[] = Array.from(new Set(candidates));
          if (imageUrls.length === 0) return;

          const image = await editAvatarImage({
            prompt: improved.enhancedPrompt || basePrompt,
            image_urls: imageUrls
          });

          const lookRef = avatarRef.looks.find((l: any) => l.id === lookId);
          if (lookRef) {
            lookRef.thumbnail = image.url;
          }
          if (!avatarRef.thumbnail) {
            avatarRef.thumbnail = image.url;
          }
          await refreshedSpace.save();
        } catch (e) {
          console.error('Error generating avatar look (background)', e);
        }
      })
      .catch(() => {});

    // 3) Réponse immédiate, le client pollera jusqu'à ce que thumbnail soit rempli
    const lookRefInit = avatar.looks.find((l: any) => l.id === lookId);
    return NextResponse.json({ data: lookRefInit }, { status: 201 });
  } catch (error) {
    console.error("Error generating avatar look:", error);
    return NextResponse.json(
      { error: "Error generating avatar look" },
      { status: 500 }
    );
  }
}
