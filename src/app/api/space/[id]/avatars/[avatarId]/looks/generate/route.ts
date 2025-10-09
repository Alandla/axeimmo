import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { editAvatarImage } from "@/src/lib/fal";
import { VIDEO_FORMATS, VideoFormat } from "@/src/types/video";
import { extractLookIdentityInfo } from "@/src/lib/workflowai";
import { nanoid } from "nanoid";

// Common hint used to bias generations for podcast scenes
const PODCAST_HINT = " The scene is a podcast, the avatar is not looking at the camera, he is looking away as if he were talking, there is a microphone in front of him.";

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
    const format: VideoFormat | undefined =
      typeof body?.format === 'string' ? (body.format as VideoFormat) : undefined;
    const style: 'ugc-realist' | 'studio' | 'podcast' | undefined = body?.style;
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

    // 1) Create a pending look entry
    const lookId = nanoid();
    const look = {
      id: lookId,
      name: body?.lookName || "Generated Look",
      place: body?.place || "unspecified",
      tags: Array.isArray(body?.tags) ? body.tags : [],
      thumbnail: "",
      previewUrl: "",
      videoUrl: "",
      format: (format && ["vertical","ads","square","horizontal"].includes(format)) ? format : "vertical",
      settings: {},
    };
    avatar.looks = avatar.looks || [];
    avatar.looks.push(look as any);

    // Immediately extract name/place/tags from user prompt, helping the model with avatar info when available
    try {
      const avatarHints = [
        avatar?.name ? `Name: ${avatar.name}` : undefined,
        avatar?.gender ? `Gender: ${avatar.gender}` : undefined,
        avatar?.age ? `Age: ${avatar.age}` : undefined,
        Array.isArray(avatar?.tags) && avatar.tags.length
          ? `Tags: ${avatar.tags.join(', ')}`
          : undefined,
      ]
        .filter(Boolean)
        .join(' | ')

      const extractionPrompt = avatarHints
        ? `${description}. Context: ${avatarHints}.`
        : description

      const extractedNow = await extractLookIdentityInfo(extractionPrompt)
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

          // Use the user's prompt as-is; add podcast hint when needed
          const basePrompt = style === 'podcast' ? `${description}${PODCAST_HINT}` : description;

          // Préparer les images: priorité aux images fournies, sinon thumbnail
          const candidates: string[] = (providedImages.length > 0
            ? providedImages
            : [avatarRef?.thumbnail]
          ).filter((v): v is string => typeof v === 'string' && v.length > 0);
          const imageUrls: string[] = Array.from(new Set(candidates));
          if (imageUrls.length === 0) return;

          // Mapper format -> aspect_ratio via VIDEO_FORMATS (fallback 9:16)
          const selectedFormat = (format && ["vertical","ads","square","horizontal"].includes(format)) ? format : "vertical";
          const aspect_ratio = (VIDEO_FORMATS.find(f => f.value === selectedFormat)?.ratio) || '9:16';

          const image = await editAvatarImage({
            prompt: basePrompt,
            image_urls: imageUrls,
            aspect_ratio
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
