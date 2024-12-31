import { generateThumbnail } from "@/src/lib/render";
import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/video/thumbnail by user: ", session.user.id);

  const params = await req.json();

  const { video } = params;

  try {
    const thumbnail = await generateThumbnail(video);

    console.log("thumbnailUrl", thumbnail)

    const data = {  
      url: thumbnail.url,
      estimatedPrice: thumbnail.estimatedPrice.accruedSoFar
    }
        
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail" },
      { status: 500 }
    );
  }
} 