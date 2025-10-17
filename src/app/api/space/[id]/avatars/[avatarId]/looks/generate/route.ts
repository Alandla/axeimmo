import { NextRequest, NextResponse } from "next/server";
import type { AvatarStyle } from "@/src/types/avatar";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { addLookToAvatar, getSpaceById, updateLookInAvatar } from "@/src/dao/spaceDao";
import { editAvatarImage } from "@/src/lib/fal";
import { VIDEO_FORMATS, VideoFormat } from "@/src/types/video";
import { extractLookIdentityInfo } from "@/src/lib/workflowai";
import { nanoid } from "nanoid";
// SpaceModel removed in favor of DAO methods
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";
import { removeCreditsToSpace, addCreditsToSpace } from "@/src/dao/spaceDao";
import { AVATAR_LOOK_GENERATION_COST } from "@/src/lib/cost";

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

    // Check if space has enough credits
    if (space.credits < AVATAR_LOOK_GENERATION_COST) {
      return NextResponse.json(
        { 
          error: "Insufficient credits", 
          required: AVATAR_LOOK_GENERATION_COST, 
          available: space.credits 
        },
        { status: 402 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const description: string | undefined = body?.description;
    const format: VideoFormat | undefined =
      typeof body?.format === 'string' ? (body.format as VideoFormat) : undefined;
    const style: AvatarStyle | undefined = body?.style;
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
      createdBy: session.user.id,
      format: (format && ["vertical","ads"].includes(format)) ? format : "vertical",
      settings: {},
      status: 'pending',
      createdAt: now,
    };
    // Deduct credits first to avoid free look if persistence fails
    await removeCreditsToSpace(params.id, AVATAR_LOOK_GENERATION_COST);

    // Persist the pending look atomically; on failure, refund and abort
    try {
      await addLookToAvatar(params.id, params.avatarId, look);
    } catch (persistError) {
      await addCreditsToSpace(params.id, AVATAR_LOOK_GENERATION_COST);
      console.error('Failed to persist pending look, refunded credits:', persistError);
      return NextResponse.json(
        { error: "Failed to persist look" },
        { status: 500 }
      );
    }

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
      const updates: Record<string, any> = {}
      if (extractedNow.name) updates.name = extractedNow.name
      if (extractedNow.place) updates.place = extractedNow.place
      if (Array.isArray(extractedNow.tags)) updates.tags = extractedNow.tags
      if (Object.keys(updates).length > 0) {
        await updateLookInAvatar(params.id, params.avatarId, lookId, updates)
        // Reflect in local copy for response
        Object.assign(look, updates)
      }
    } catch {}

    // 2) Déclencher la génération en arrière-plan (comme pour la création d'avatar)
    waitUntil((async () => {
      try {
        const refreshedSpace: any = await getSpaceById(params.id);
        const avatarRef: any = refreshedSpace?.avatars?.find((a: any) => a.id === params.avatarId);
        if (!avatarRef) {
          await updateLookInAvatar(params.id, params.avatarId, lookId, {
            status: 'error',
            errorMessage: 'Avatar reference not found during generation',
            errorAt: new Date(),
          });
          await addCreditsToSpace(params.id, AVATAR_LOOK_GENERATION_COST);
          console.info(`Refunded ${AVATAR_LOOK_GENERATION_COST} credits to space ${params.id} due to missing avatarRef`);
          return;
        }

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
        if (imageUrls.length === 0) {
          await updateLookInAvatar(params.id, params.avatarId, lookId, {
            status: 'error',
            errorMessage: 'No image sources available for generation',
            errorAt: new Date(),
          });
          await addCreditsToSpace(params.id, AVATAR_LOOK_GENERATION_COST);
          console.info(`Refunded ${AVATAR_LOOK_GENERATION_COST} credits to space ${params.id} due to no image candidates`);
          return;
        }

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

          await updateLookInAvatar(params.id, params.avatarId, lookId, {
            thumbnail: savedUrl,
            status: 'ready'
          })
        } catch (falErr) {
          await updateLookInAvatar(params.id, params.avatarId, lookId, {
            status: 'error',
            errorMessage: (falErr as any)?.message || 'FAL generation failed',
            errorAt: new Date(),
          })
          // Refund credits to user
          await addCreditsToSpace(params.id, AVATAR_LOOK_GENERATION_COST);
          console.info(`Refunded ${AVATAR_LOOK_GENERATION_COST} credits to space ${params.id} due to look generation failure`);
          throw falErr;
        }
      } catch (e) {
        console.error('Error generating avatar look (background)', e);
      }
    })());

    // 3) Réponse immédiate, le client pollera jusqu'à ce que thumbnail soit rempli
    // Return the look we just inserted (with any extracted updates applied locally)
    return NextResponse.json({ data: look }, { status: 201 });
  } catch (error) {
    console.error("Error generating avatar look:", error);
    return NextResponse.json(
      { error: "Error generating avatar look" },
      { status: 500 }
    );
  }
}
