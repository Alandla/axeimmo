import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { duplicateVideo } from '@/src/dao/videoDao'
import { isUserInSpace } from '@/src/dao/userDao'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("POST /api/video/duplicate by user: ", session.user.id)

  const params = await req.json()
  const { videoId, spaceId } = params

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  if (!spaceId) {
    return NextResponse.json({ error: "Space ID is required" }, { status: 400 })
  }

  try {
    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId)
    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const duplicatedVideo = await duplicateVideo(videoId, session.user.id)

    return NextResponse.json({ data: duplicatedVideo })
  } catch (error) {
    console.error('Error duplicating video:', error)
    return NextResponse.json({ error: 'Failed to duplicate video' }, { status: 500 })
  }
}
