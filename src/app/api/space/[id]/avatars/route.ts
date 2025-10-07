import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById } from "@/src/dao/spaceDao";
import { ISpace } from "@/src/types/space";
import { nanoid } from "nanoid";
import { extractAvatarIdentityFromPrompt, improveAvatarPrompt } from "@/src/lib/workflowai";
import { generateAvatarImage } from "@/src/lib/fal";

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

    // Forcer uniquement les champs id à rester ceux définis par le modèle (nanoid)
    // sans reformater le reste de la structure
    const rawAvatars: any[] = (space as any).avatars || [];
    const avatarsWithFixedIds = rawAvatars.map((a: any) => {
      const base = typeof a.toObject === 'function' ? a.toObject() : a;
      return {
        ...base,
        id: a.id, // préserver l'id custom d'avatar
      }
    });

    return NextResponse.json({ data: avatarsWithFixedIds });
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
    const basePrompt: string | undefined = body?.prompt;
    const imageUrl: string | undefined = body?.imageUrl;
    if (!basePrompt && !imageUrl) {
      return NextResponse.json(
        { error: "prompt or imageUrl is required" },
        { status: 400 }
      );
    }

    // 1) Extraction identité depuis le prompt si fourni
    let inferredName: string | undefined;
    let inferredGender: "male" | "female" | undefined;
    let inferredAge: string | undefined;
    let inferredTags: string[] | undefined;
    let inferredPlace: string | undefined;
    if (basePrompt) {
      const extracted = await extractAvatarIdentityFromPrompt(basePrompt);
      inferredName = extracted.name;
      inferredGender = extracted.gender;
      inferredAge = extracted.age;
      inferredTags = extracted.tags;
      inferredPlace = extracted.place;
    }

    const name: string = inferredName || "Custom Avatar";
    const gender: "male" | "female" = (inferredGender || "male") as any;
    const age: string = inferredAge || "undefined";
    const tags: string[] = Array.isArray(inferredTags) ? inferredTags : [];
    const place: string = inferredPlace || "unspecified";

    const avatarId = nanoid();

    // 2) Créer automatiquement le premier look
    // Si imageUrl est fourni, on l'utilise directement, sinon on génère depuis le prompt
    let finalPrompt: string | undefined = undefined;
    if (!imageUrl && basePrompt) {
      const improved = await improveAvatarPrompt(basePrompt).catch(() => ({ enhancedPrompt: basePrompt }));
      finalPrompt = improved.enhancedPrompt || basePrompt;
    }

    const lookId = nanoid();
    const look = {
      id: lookId,
      name: "First Look",
      place: place,
      tags: tags,
      thumbnail: imageUrl || "",
      previewUrl: "",
      videoUrl: "",
      format: "vertical",
      settings: {},
    };

    const newAvatar: any = {
      id: avatarId,
      name,
      age,
      gender,
      tags,
      thumbnail: imageUrl || "",
      looks: [look],
    };

    (space as any).avatars.push(newAvatar);
    await (space as any).save();

    // Génération image en arrière-plan uniquement si aucune image n'a été fournie
    if (!imageUrl && finalPrompt) {
      Promise.resolve()
        .then(async () => {
          try {
            const img = await generateAvatarImage({ prompt: finalPrompt as string });
            const refreshedSpace: ISpace = await getSpaceById(params.id);
            const avatarRef: any = (refreshedSpace as any).avatars.find((a: any) => a.id === avatarId);
            const lookRef: any = avatarRef?.looks?.find((l: any) => l.id === lookId);
            if (lookRef) {
              lookRef.thumbnail = img.url;
            }
            if (avatarRef && !avatarRef.thumbnail) {
              avatarRef.thumbnail = img.url;
            }
            await (refreshedSpace as any).save();
          } catch (e) {
            console.error('Error generating first avatar look image (background)', e);
          }
        })
        .catch(() => {});
    }

    return NextResponse.json({ data: newAvatar }, { status: 201 });
  } catch (error) {
    console.error("Error creating space avatar:", error);
    return NextResponse.json(
      { error: "Error creating space avatar" },
      { status: 500 }
    );
  }
}
