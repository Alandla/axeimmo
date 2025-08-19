import { chromium, Browser, Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Browserbase } from '@browserbasehq/sdk';

export interface BrowserBaseConfig {
  apiKey: string;
  projectId: string;
  region?: string;
  keepAlive?: boolean;
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
    return 'eu-central-1'; // Default BrowserBase region
  }

  return regionMap[vercelRegion] || 'eu-central-1';
}

/**
 * Create a new BrowserBase session optimized for the current region
 */
export async function createBrowserBaseSession(config: BrowserBaseConfig): Promise<{ sessionId: string; connectUrl: string }> {
  const browserBaseRegion = mapVercelToBrowserBaseRegion(config.region);
  
  console.log(`Creating BrowserBase session in region: ${browserBaseRegion} (mapped from Vercel region: ${config.region})`);

  const bb = new Browserbase({
    apiKey: config.apiKey,
  });

  const session = await bb.sessions.create({
    projectId: config.projectId,
    region: browserBaseRegion as any,
  });

  return {
    sessionId: session.id,
    connectUrl: session.connectUrl,
  };
}

/**
 * Initialize Playwright browser with BrowserBase session
 */
export async function initializeBrowser(connectUrl: string): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.connectOverCDP(connectUrl);
  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext();
  const pages = context.pages();
  const page = pages[0] || await context.newPage();
  
  return { browser, page };
}

/**
 * Extract clean content from a URL using Readability
 */
export async function extractCleanContent(page: Page, url: string): Promise<Omit<ExtractedContent, 'images' | 'extractionMethod'>> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
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
 * Extract images from the current page without any interactions
 */
export async function extractImagesFromPage(page: Page): Promise<ExtractedImage[]> {
  try {
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      console.log("imgs found : ", imgs.length)
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
        if (img.width < 250 && img.height < 250) {
          console.log(`[BrowserBase] Image exclue car trop petite : ${img.src} (${img.width}x${img.height})`);
          return false;
        }
        
        const parentClass = img.parentInfo.className.toLowerCase();
        const parentId = img.parentInfo.id.toLowerCase();
        
        // Exclude header/footer/nav images
        const excludeKeywords = ['header', 'footer', 'nav', 'menu', 'logo', 'banner', 'ad', 'advertisement'];
        const isExcluded = excludeKeywords.some(keyword => 
          parentClass.includes(keyword) || parentId.includes(keyword)
        );
        
        if (isExcluded) {
          console.log(`[BrowserBase] Image exclue car parent class/id contient un mot-clé exclu : ${img.src} (class: ${parentClass}, id: ${parentId})`);
          return false;
        }
        
        // Prefer images in main content areas or larger images
        const isRelevant = img.parentInfo.isInMainContent || img.width > 200;
        if (!isRelevant) {
          console.log(`[BrowserBase] Image exclue car hors contenu principal et trop petite : ${img.src} (${img.width}x${img.height})`);
        }
        return isRelevant;
      });
    });

    return images;
  } catch (error) {
    console.error('Error in basic image extraction:', error);
    
    try {
      // Fallback: simple image extraction
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

export async function fairmooveImageExtraction(page: Page): Promise<ExtractedImage[]> {
  try {

    // Click the predefined XPath to expand images
    console.log('Accepting cookies');
    
    const xpathCookies = '/html/body/dialog/div[2]/div/div[2]/div[2]/div[2]/div[3]/button';

    await page.locator(`xpath=${xpathCookies}`).click();
    
    const xpath = '/html/body/div[1]/div/main/div/div[2]/div[1]/div[2]/div[3]/div/div';
    
    try {
      console.log("Clicking image expansion button with predefined XPath...");
      await page.waitForTimeout(3000);
      await page.locator(`xpath=${xpath}`).click();
      console.log('Successfully clicked image expansion button');
    } catch (clickError) {
      console.log('Could not click image expansion button, continuing with basic extraction');
    }

    await page.waitForTimeout(3000);
    await page.waitForTimeout(1000);

    console.info("Check images")

    // Extract images after interactions
    const imagesAfter = await extractImagesFromPage(page);
    console.log(`Images found after interactions: ${imagesAfter.length}`);

    return imagesAfter;

  } catch (error) {
    console.error('Error in fairmoove image extraction:', error);
    return await extractImagesFromPage(page);
  }
}

export async function odisseiasImageExtraction(page: Page): Promise<ExtractedImage[]> {
  try {
    console.log('Starting odisseias image extraction');
    
    // Try to click image expansion button
    const xpath = '/html/body/div[4]/div[5]/div[2]/div[1]/section/div[2]/div[1]/div[1]/div';
    
    try {
      console.log("Clicking image expansion button for odisseias with predefined XPath...");
      await page.waitForTimeout(2000);
      await page.locator(`xpath=${xpath}`).click({ timeout: 5000 });
      console.log('Successfully clicked odisseias image expansion button');
    } catch (clickError) {
      console.log('Could not click odisseias image expansion button, continuing with basic extraction');
    }

    await page.waitForTimeout(3000);
    await page.waitForTimeout(1000);

    console.info("Check images for odisseias")

    // Extract images after interactions
    const imagesAfter = await extractImagesFromPage(page);
    console.log(`Images found after interactions for odisseias: ${imagesAfter.length}`);

    return imagesAfter;

  } catch (error) {
    console.error('Error in odisseias image extraction:', error);
    return await extractImagesFromPage(page);
  }
}

/**
 * Quick DOM extraction (Phase 1) - Returns content fast for script generation
 */
export async function extractQuickContent(
  url: string,
  config: BrowserBaseConfig
): Promise<{ content: Omit<ExtractedContent, 'images' | 'extractionMethod'>; sessionId: string; connectUrl: string }> {
  const { sessionId, connectUrl } = await createBrowserBaseSession(config);
  console.log("Session ID", sessionId)
  
  const { browser, page } = await initializeBrowser(connectUrl);
  console.log("Browser initialized")
  
  try {
    const cleanContent = await extractCleanContent(page, url);
    
    // Don't close browser - keep session alive for background processing
    return {
      content: cleanContent,
      sessionId,
      connectUrl
    };
  } catch (error) {
    console.error('Error in quick content extraction:', error);
    try {
      await browser.close();
    } catch (closeError) {
      console.error('Error closing browser after extraction error:', closeError);
    }
    throw error;
  }
}

/**
 * Background image extraction (Phase 2) - Uses existing session for enhanced image discovery
 * No page.goto needed - we're already on the page from Phase 1
 */
export async function extractBackgroundImages(
  connectUrl: string,
  url?: string
): Promise<ExtractedImage[]> {
  let browser: Browser | null = null;

  console.log("extractBackgroundImages", connectUrl, "for URL:", url)

  try {
    const { browser: browserInstance, page } = await initializeBrowser(connectUrl);
    browser = browserInstance;
    
    // No need for page.goto - we're already on the page from Phase 1
    // Choose extraction method based on URL
    let extractionMethod: (page: Page) => Promise<ExtractedImage[]>;
    
    if (url?.includes('fairmoove.fr')) {
      console.log('Using fairmoove extraction method');
      extractionMethod = fairmooveImageExtraction;
    } else if (url?.includes('odisseias.com')) {
      console.log('Using odisseias extraction method');
      extractionMethod = odisseiasImageExtraction;
    } else {
      console.log('Using basic extraction method');
      extractionMethod = extractImagesFromPage;
    }
    
    return await extractionMethod(page);

  } catch (error) {
    console.error('Error in background image extraction:', error);
    throw error;
  } finally {
    // Now we can close the session
    console.log("Closing browser")
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser in background extraction:', error);
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
  let browser: Browser | null = null;

  try {
    // Create session and initialize browser
    const { connectUrl } = await createBrowserBaseSession(config);
    const { browser: browserInstance, page } = await initializeBrowser(connectUrl);
    browser = browserInstance;

    // Extract clean content
    const cleanContent = await extractCleanContent(page, url);
    
    // Choose extraction method based on URL
    let extractionMethod: (page: Page) => Promise<ExtractedImage[]>;
    
    if (url.includes('fairmoove.fr')) {
      extractionMethod = fairmooveImageExtraction;
    } else if (url.includes('odisseias.com')) {
      extractionMethod = odisseiasImageExtraction;
    } else {
      extractionMethod = extractImagesFromPage;
    }
    
    // Extract enhanced images
    const images = await extractionMethod(page);

    return {
      ...cleanContent,
      images,
      extractionMethod: 'browserbase-enhanced'
    };

  } finally {
    // Clean up resources
    console.log("Closing browser")
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
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

  if (!apiKey || !projectId) {
    throw new Error('Missing BrowserBase configuration. Check BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID environment variables.');
  }

  // Get the Vercel region (will be mapped to BrowserBase region in createBrowserBaseSession)
  const region = process.env.VERCEL_REGION || 'dev1'; // 'dev1' for local development

  return {
    apiKey,
    projectId,
    region,
    keepAlive: true
  };
}