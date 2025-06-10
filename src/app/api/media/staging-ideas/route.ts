import { NextRequest, NextResponse } from 'next/server'
import { generateImageStagingIdeas } from '@/src/lib/workflowai'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

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