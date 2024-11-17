import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { getGoogleImagesMedia } from '@/src/lib/google';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/getGoogleImage by user: ", session.user.id);

  const params = await req.json();

  const { keyword, number, page } = params;

  try {

    const results = await getGoogleImagesMedia(keyword, number, page)

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error getting google images:', error)
    return NextResponse.json({ error: 'Error getting google images' }, { status: 500 })
  }
}