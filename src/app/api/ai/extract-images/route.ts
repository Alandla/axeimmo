import { NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { webPageContentExtractionRun } from "@/src/lib/workflowai"

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("POST /api/ai/extract-images by user:", session.user.id);

  try {
    const params = await req.json()
    const { markdownContent } = params

    if (!markdownContent || typeof markdownContent !== 'string') {
      return NextResponse.json({ error: "markdownContent is required and must be a string" }, { status: 400 })
    }

    // Extraire les images pertinentes avec WorkflowAI
    const result = await webPageContentExtractionRun(markdownContent)

    return NextResponse.json({
      data: {
        relevantImages: result.relevantImages,
        cost: result.cost
      }
    })
  } catch (error) {
    console.error("Error extracting images from content:", error)
    return NextResponse.json(
      { error: "Error extracting images from content" },
      { status: 500 }
    )
  }
} 