import { NextRequest, NextResponse } from 'next/server'
import Parser from '@postlight/parser';
import { auth } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/article/getContent by user: ", session.user.id);

  const params = await req.json();

  const { url } = params;

  try {

    const content = await Parser.parse(url)

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL présignée:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération de l\'URL présignée' }, { status: 500 })
  }
}