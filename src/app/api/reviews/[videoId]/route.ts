import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { getReviewByVideoId } from '@/src/dao/reviewDao';

export async function GET(req: NextRequest, { params }: { params: { videoId: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  console.log("GET /api/reviews/[videoId] by user: ", session.user.id);

  try {
    const review = await getReviewByVideoId(params.videoId, session.user.id);
    return NextResponse.json({ data: review });
  } catch (error) {
    console.error('Erreur GET review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la review' },
      { status: 500 }
    );
  }
} 