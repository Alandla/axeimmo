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
  const { url, phase, connectUrl } = params;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const config = getBrowserBaseConfig();

  try {
    // Phase 2: Return background images using existing session
    if (phase === 'get-images') {
      if (!connectUrl) {
        return NextResponse.json({ error: "connectUrl is required for get-images phase" }, { status: 400 });
      }
      
      console.log(`Getting background images for URL: ${url}...`);
      const images = await extractBackgroundImages(connectUrl, url);
      
      return NextResponse.json({ 
        data: { images, imageCount: images.length }
      });
    }

    // Phase 1: Quick content extraction + return sessionId and connectUrl for background processing
    console.log(`Phase 1: Quick content extraction for ${url}...`);
    const { content, sessionId: newSessionId, connectUrl: newConnectUrl } = await extractQuickContent(url, config);
    
    console.log(`Quick content extracted for ${url}, session ${newSessionId} kept alive for background processing`);

    return NextResponse.json({ 
      data: {
        ...content,
        sessionId: newSessionId,
        connectUrl: newConnectUrl,
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