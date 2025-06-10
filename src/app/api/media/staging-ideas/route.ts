import { NextRequest, NextResponse } from 'next/server'
import { generateImageStagingIdeas } from '@/src/lib/workflowai'
import { auth } from '@/src/lib/auth'
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/staging-ideas by user: ", session.user.id);

  const { imageUrl } = await req.json();

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Image URL is required' },
      { status: 400 }
    )
  }

  try {

    const result = await generateImageStagingIdeas(imageUrl)

    return NextResponse.json({
      data: {
        stagingIdeas: result.stagingIdeas,
        cost: result.cost
      }
    })

  } catch (error) {
    console.error('Error generating staging ideas:', error)
    return NextResponse.json(
      { error: 'Failed to generate staging ideas' },
      { status: 500 }
    )
  }
} 