import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { extractQuickContent, extractBackgroundImages, getBrowserBaseConfig } from '@/src/lib/browserbase';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/article/extract-enhanced by user: ", session.user.id);

  const params = await req.json();
  const { url, phase, sessionId } = params;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const config = getBrowserBaseConfig();

  try {
    // Phase 2: Return background images using new session with JS enabled
    if (phase === 'get-images') {
      console.log(`Getting background images for URL: ${url}...`);
      const images = await extractBackgroundImages(url, config);
      
      return NextResponse.json({ 
        data: { images, imageCount: images.length }
      });
    }

    // Phase 1: Quick content extraction + return sessionId for background processing
    console.log(`Phase 1: Quick content extraction for ${url}...`);
    const { content, sessionId: newSessionId } = await extractQuickContent(url, config);
    
    console.log(`Quick content extracted for ${url}, session ${newSessionId} kept alive for background processing`);

    return NextResponse.json({ 
      data: {
        ...content,
        sessionId: newSessionId,
        extractionMethod: 'browserbase-parallel',
        hasBackgroundProcessing: true
      }
    });

  } catch (error) {
    console.error('Error in enhanced article extraction:', error);
    
    let errorMessage = 'Failed to extract article content with enhanced method';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 });
  }
}