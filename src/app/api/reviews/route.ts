import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { createReview, updateReview } from '@/src/dao/reviewDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/reviews by user: ", session.user.id);

  const params = await req.json();

  const { videoId, stars } = params;

  try {
    const newReview = await createReview({
      userId: session.user.id,
      videoId,
      stars
    });

    return NextResponse.json({ data: newReview });
  } catch (error) {
    console.error('Erreur POST review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la review' },
      { status: 500 }
    );
  }
}