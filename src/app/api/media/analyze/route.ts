import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/src/lib/auth';
import { waitUntil } from "@vercel/functions";
import { IMediaSpace } from "@/src/types/space";
import { analyzeMediaInBackground } from "@/src/service/media-analysis.service";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/analyze by user: ", session.user.id);

  const { media, spaceId } = await req.json();

  if (!media || !spaceId) {
    return NextResponse.json(
      { error: "Parameters media and spaceId are required" },
      { status: 400 }
    );
  }

  try {
    waitUntil(analyzeMediaInBackground(media, spaceId));

    return NextResponse.json({
      success: true,
      message: "Media analysis started"
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
} 