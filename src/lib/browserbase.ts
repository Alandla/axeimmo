import { Stagehand } from '@browserbasehq/stagehand';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface BrowserBaseConfig {
  apiKey: string;
  projectId: string;
  openaiApiKey: string;
  region?: string;
  keepAlive?: boolean;
  browserSettings?: {
    recordSession?: boolean;
  };
}

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  byline: string;
  images: ExtractedImage[];
  extractionMethod: 'browserbase-enhanced';
}

export interface ExtractedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  parentInfo: {
    tagName: string;
    className: string;
    id: string;
    isInMainContent: boolean;
  };
}

/**
 * Map Vercel regions to BrowserBase regions
 */
function mapVercelToBrowserBaseRegion(vercelRegion?: string): string {
  // Available BrowserBase regions: us-west-2, us-east-1, eu-central-1, ap-southeast-1
  const regionMap: Record<string, string> = {
    'iad1': 'us-east-1',        // Washington, D.C. -> Virginia
    'dfw1': 'us-west-2',        // Dallas -> Oregon
    'sfo1': 'us-west-2',        // San Francisco -> Oregon
    'pdx1': 'us-west-2',        // Portland -> Oregon
    'cdg1': 'eu-central-1',     // Paris -> Frankfurt
    'fra1': 'eu-central-1',     // Frankfurt -> Frankfurt
    'lhr1': 'eu-central-1',     // London -> Frankfurt
    'sin1': 'ap-southeast-1',   // Singapore -> Singapore
    'nrt1': 'ap-southeast-1',   // Tokyo -> Singapore
    'syd1': 'ap-southeast-1',   // Sydney -> Singapore
  };

  if (!vercelRegion || vercelRegion === 'dev1') {
    return 'us-west-2'; // Default BrowserBase region
  }

  return regionMap[vercelRegion] || 'us-west-2';
}

/**
 * Create a new BrowserBase session optimized for the current region
 */
export async function createBrowserBaseSession(config: BrowserBaseConfig): Promise<string> {
  const browserBaseRegion = mapVercelToBrowserBaseRegion(config.region);
  
  console.log(`Creating BrowserBase session in region: ${browserBaseRegion} (mapped from Vercel region: ${config.region})`);

  const response = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: {
      'x-bb-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      projectId: config.projectId,
      region: browserBaseRegion
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create BrowserBase session: ${response.statusText}`);
  }

  const { id } = await response.json();
  return id;
}

/**
 * Initialize Stagehand with BrowserBase session
 */
export function initializeStagehand(sessionId: string, config: BrowserBaseConfig): Stagehand {
  return new Stagehand({
    env: 'BROWSERBASE',
    apiKey: config.apiKey,
    projectId: config.projectId,
    browserbaseSessionID: sessionId,
    modelName: 'gpt-4.1-mini',
    modelClientOptions: {
      apiKey: config.openaiApiKey,
      baseURL: 'https://api.openai.com/v1'
    }
  });
}

/**
 * Extract clean content from a URL using Readability
 */
export async function extractCleanContent(page: any, url: string): Promise<Omit<ExtractedContent, 'images' | 'extractionMethod'>> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('Looking for photo expansion buttons...');
    
  const observeResult = await page.act("Find out if there is a button to view all photos, plus photos, show more images, or see all pictures. Look for any buttons that might reveal additional photos.");
  console.log("observeResult", observeResult)

  if (observeResult && observeResult.length > 0) {
    const [photoAction] = observeResult;
    console.log('Found photo expansion action:', photoAction);
  }
  
  const content = await page.content();
  const dom = new JSDOM(content);
  const article = new Readability(dom.window.document).parse();
  
  return {
    title: article?.title || '',
    content: article?.textContent || '',
    excerpt: article?.excerpt || '',
    byline: article?.byline || ''
  };
}

/**
 * Clean XPath selector by removing /text() nodes at the end
 * Handles both string selectors and action objects with selector property
 */
function cleanXPathSelector(selectorOrAction: any): any {
  // If it's an object with a selector property, clean the selector
  if (selectorOrAction && typeof selectorOrAction === 'object' && selectorOrAction.selector) {
    const textNodePattern = /\/text\(\)(\[\d+\])?$/;
    if (textNodePattern.test(selectorOrAction.selector)) {
      const cleanedSelector = selectorOrAction.selector.replace(textNodePattern, '');
      console.log(`Cleaned XPath selector in action object: ${selectorOrAction.selector} -> ${cleanedSelector}`);
      
      // Return a copy of the object with the cleaned selector
      return {
        ...selectorOrAction,
        selector: cleanedSelector
      };
    }
  }
  
  return selectorOrAction;
}

/**
 * Enhanced image extraction with AI-powered interaction
 */
export async function enhancedImageExtraction(page: any): Promise<ExtractedImage[]> {
  try {
    // Step 1: Observe photo expansion buttons (cached action)
    console.log('Looking for photo expansion buttons...');
    
    const observeResult = await page.observe({
      instruction: "Find out if there is a button to view all photos, plus photos, show more images, or see all pictures. Look for any buttons that might reveal additional photos."
    });

    if (observeResult && observeResult.length > 0) {
      const [photoAction] = observeResult;
      console.log('Found photo expansion action:', photoAction);
      
      // Clean the selector if it contains /text() nodes
      const cleanedPhotoAction = cleanXPathSelector(photoAction);
      
      
      try {
        // Use the cleaned action
        await page.act(cleanedPhotoAction);
        await page.waitForTimeout(1000);
        console.log('Successfully expanded photo gallery');
      } catch (clickError) {
        // Step 2: Handle cookies if click failed
        console.log('Click failed, trying to handle cookies...');
        await page.waitForTimeout(30000);
        try {
          const cookieObserve = await page.observe({
            instruction: "If there is a cookie banner, you must accept them."
          });
          console.log("cookieObserve", cookieObserve)
          if (cookieObserve && cookieObserve.length > 0) {
            const [cookieAction] = cookieObserve;
            console.log("cookieAction", cookieAction)
            await page.act(cookieAction);
            console.log("cookieAction done")
            await page.waitForTimeout(1000);
            
            // Retry photo expansion with cleaned action
            await page.act(cleanedPhotoAction);
            await page.waitForTimeout(1000);
            console.log('Successfully expanded photos after handling cookies');
          }
        } catch (retryError) {
          console.log('Could not expand photos after cookie handling');
        }
      }
    }

    // Step 3: Extract all relevant images
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      console.log("imgs", imgs)
      return imgs.map(img => {
        return {
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          parentInfo: {
            tagName: img.parentElement?.tagName || '',
            className: img.parentElement?.className || '',
            id: img.parentElement?.id || '',
            isInMainContent: Boolean(img.closest('main, article, .content, [role="main"], .post, .entry'))
          }
        };
      }).filter(img => {
        // Filter criteria for relevant images
        if (img.width < 100 || img.height < 100) return false;
        
        const parentClass = img.parentInfo.className.toLowerCase();
        const parentId = img.parentInfo.id.toLowerCase();
        
        // Exclude header/footer/nav images
        const excludeKeywords = ['header', 'footer', 'nav', 'menu', 'logo', 'banner', 'ad', 'advertisement'];
        const isExcluded = excludeKeywords.some(keyword => 
          parentClass.includes(keyword) || parentId.includes(keyword)
        );
        
        if (isExcluded) return false;
        
        // Prefer images in main content areas or larger images
        return img.parentInfo.isInMainContent || img.width > 200;
      });
    });

    console.log(`Enhanced extraction found ${images.length} relevant images`);
    return images;

  } catch (error) {
    console.error('Error in enhanced image extraction:', error);
    
    // Check if the error is related to a closed session
    if (error instanceof Error && error.message.includes('closed')) {
      console.log('Browser session closed, cannot extract images');
      return [];
    }
    
    try {
      // Fallback: basic image extraction (only if session is still active)
      const basicImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          parentInfo: {
            tagName: img.parentElement?.tagName || '',
            className: img.parentElement?.className || '',
            id: img.parentElement?.id || '',
            isInMainContent: false
          }
        })).filter(img => img.width >= 100 && img.height >= 100);
      });
      
      return basicImages;
    } catch (fallbackError) {
      console.error('Fallback image extraction also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Quick DOM extraction (Phase 1) - Returns content fast for script generation
 */
export async function extractQuickContent(
  url: string,
  config: BrowserBaseConfig
): Promise<{ content: Omit<ExtractedContent, 'images' | 'extractionMethod'>; sessionId: string }> {
  const sessionId = await createBrowserBaseSession(config);
  console.log("Session ID", sessionId)
  const stagehand = initializeStagehand(sessionId, config);
  console.log("Stagehand create")
  
  try {
    console.log("Waiting for stagehand to initialize")
    await stagehand.init();
    console.log("Stagehand initialized")
    
    // Add a small delay to ensure full initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const page = stagehand.page;

    const cleanContent = await extractCleanContent(page, url);
    
    // Don't close Stagehand - keep session alive for background processing
    return {
      content: cleanContent,
      sessionId
    };
  } catch (error) {
    console.error('Error in quick content extraction:', error);
    // Make sure to close Stagehand on error
    console.log("Closing Stagehand 3")
    try {
      await stagehand.close();
    } catch (closeError) {
      console.error('Error closing Stagehand after extraction error:', closeError);
    }
    throw error;
  }
}

/**
 * Background image extraction (Phase 2) - Uses existing session for enhanced image discovery
 * No page.goto needed - we're already on the page from Phase 1
 */
export async function extractBackgroundImages(
  sessionId: string,
  config: BrowserBaseConfig
): Promise<ExtractedImage[]> {
  let stagehand: Stagehand | null = null;

  console.log("extractBackgroundImages", sessionId, config)

  try {
    stagehand = initializeStagehand(sessionId, config);
    await stagehand.init();

    // Add a small delay to ensure full initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    const page = stagehand.page;
    
    // No need for page.goto - we're already on the page from Phase 1
    // Just run enhanced image extraction on the current page
    return await enhancedImageExtraction(page);

  } catch (error) {
    console.error('Error in background image extraction:', error);
    throw error;
  } finally {
    // Now we can close the session
    console.log("Closing Stagehand 2")
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (error) {
        console.error('Error closing Stagehand in background extraction:', error);
      }
    }
  }
}

/**
 * Complete extraction workflow (for non-parallel use)
 */
export async function extractContentWithImages(
  url: string, 
  config: BrowserBaseConfig
): Promise<ExtractedContent> {
  let sessionId: string | null = null;
  let stagehand: Stagehand | null = null;

  try {
    // Create session and initialize Stagehand
    sessionId = await createBrowserBaseSession(config);
    stagehand = initializeStagehand(sessionId, config);
    await stagehand.init();

    const page = stagehand.page;

    // Extract clean content
    const cleanContent = await extractCleanContent(page, url);
    
    // Extract enhanced images
    const images = await enhancedImageExtraction(page);

    return {
      ...cleanContent,
      images,
      extractionMethod: 'browserbase-enhanced'
    };

  } finally {
    // Clean up resources
    console.log("Closing Stagehand 1")
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (error) {
        console.error('Error closing Stagehand:', error);
      }
    }
  }
}

/**
 * Get BrowserBase configuration from environment
 */
export function getBrowserBaseConfig(): BrowserBaseConfig {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !projectId || !openaiApiKey) {
    throw new Error('Missing BrowserBase or OpenAI configuration. Check BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and OPENAI_API_KEY environment variables.');
  }

  // Get the Vercel region (will be mapped to BrowserBase region in createBrowserBaseSession)
  const region = process.env.VERCEL_REGION || 'dev1'; // 'dev1' for local development

  return {
    apiKey,
    projectId,
    openaiApiKey,
    region,
    keepAlive: true,
    browserSettings: {
      recordSession: true
    }
  };
}