import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { updateReview } from '@/src/dao/reviewDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  console.log("PUT /api/reviews by user: ", session.user.id);

  const { videoId, stars, review } = await req.json();

  try {
    const updatedReview = await updateReview({
      videoId,
      stars,
      review
    });

    if (!updatedReview) {
      return NextResponse.json(
        { error: 'Review non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedReview });
  } catch (error) {
    console.error('Erreur PUT review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la review' },
      { status: 500 }
    );
  }
} 