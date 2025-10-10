import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { editAvatarImage } from "@/src/lib/fal";
import { VIDEO_FORMATS, VideoFormat } from "@/src/types/video";
import { extractLookIdentityInfo } from "@/src/lib/workflowai";
import { nanoid } from "nanoid";
import { eventBus } from "@/src/lib/events";
import SpaceModel from "@/src/models/Space";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";

// Common hint used to bias generations for podcast scenes
const PODCAST_HINT = " Podcast scene, cinematic lighting, subject in three-quarter view (3/4, slight angle), not looking at camera, speaking to someone off-camera. In front of the subject, include a realistic broadcast microphone that clearly resembles a Shure SM7B: large dynamic capsule, yoke mount on a boom arm, cylindrical body with foam windscreen. Frame so the microphone is visible and well-lit without blocking the face.";

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
    const now = new Date()
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
      status: 'pending',
      createdAt: now,
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

      // Build extraction prompt: include podcast hint when relevant; allow hint-only
      const trimmedDesc = typeof description === 'string' ? description.trim() : undefined;
      const promptForExtraction = (body?.style === 'podcast')
        ? `${trimmedDesc || ''}${PODCAST_HINT}`.trim()
        : (trimmedDesc || '');

      const extractionPrompt = avatarHints
        ? `${promptForExtraction}${promptForExtraction ? '. ' : ''}Context: ${avatarHints}.`.trim()
        : (promptForExtraction || undefined)

      const extractedNow = await extractLookIdentityInfo(extractionPrompt || "")
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

          // Use the user's prompt; add podcast hint when needed. Allow hint-only if no description provided.
          const basePrompt = style === 'podcast'
            ? `${description || ''}${PODCAST_HINT}`.trim()
            : (description as string);

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

          try {
            const image = await editAvatarImage({
              prompt: basePrompt,
              image_urls: imageUrls,
              aspect_ratio
            });

            // Persist FAL image to our storage and use internal URL
            const fileName = `look-${params.avatarId}-${lookId}-${Date.now()}`;
            const savedUrl = await uploadImageFromUrlToS3(image.url, "medias-users", fileName);

            await SpaceModel.updateOne(
              { _id: params.id },
              {
                $set: {
                  "avatars.$[a].looks.$[l].thumbnail": savedUrl,
                  "avatars.$[a].looks.$[l].status": 'ready',
                }
              },
              {
                arrayFilters: [
                  { "a.id": params.avatarId },
                  { "l.id": lookId }
                ]
              }
            )
            try {
              eventBus.emit('look.updated', { spaceId: params.id, avatarId: params.avatarId, lookId, status: 'ready' })
            } catch {}
          } catch (falErr) {
            await SpaceModel.updateOne(
              { _id: params.id },
              {
                $set: {
                  "avatars.$[a].looks.$[l].status": 'error',
                  "avatars.$[a].looks.$[l].errorMessage": (falErr as any)?.message || 'FAL generation failed',
                  "avatars.$[a].looks.$[l].errorAt": new Date(),
                }
              },
              {
                arrayFilters: [
                  { "a.id": params.avatarId },
                  { "l.id": lookId }
                ]
              }
            )
            try {
              eventBus.emit('look.updated', { spaceId: params.id, avatarId: params.avatarId, lookId, status: 'error' })
            } catch {}
            throw falErr;
          }
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
