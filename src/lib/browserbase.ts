import { chromium, Browser, Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Browserbase } from '@browserbasehq/sdk';
import { analyzeDOMForInteraction } from './ai';

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

/**
 * Clean DOM content for AI analysis by removing unnecessary elements and attributes
 */
function cleanDOMForAnalysis(htmlContent: string): string {
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Remove unnecessary elements
    const elementsToRemove = [
      'script',
      'style', 
      'meta',
      'link',
      'noscript',
      'iframe',
      'embed',
      'object',
      'svg',
      'path',
      'head'
    ];

    elementsToRemove.forEach(tagName => {
      const elements = document.querySelectorAll(tagName);
      elements.forEach(el => el.remove());
    });

    // Remove comments
    const walker = dom.window.document.createTreeWalker(
      document.body || document,
      dom.window.NodeFilter.SHOW_COMMENT
    );
    const comments: Node[] = [];
    let node;
    while (node = walker.nextNode()) {
      comments.push(node);
    }
    comments.forEach(comment => {
      if (comment.parentNode) {
        comment.parentNode.removeChild(comment);
      }
    });

    // Clean attributes - keep only essential ones
    const keepAttributes = [
      'id',
      'href',
      'alt',
      'title',
      'aria-label',
      'data-testid',
      'role',
      'type',
      'value',
      'placeholder',
      'class'
    ];

    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      // Get all attribute names
      const attributeNames = Array.from(element.attributes).map(attr => attr.name);
      
      // Remove attributes not in keepAttributes list
      attributeNames.forEach(attrName => {
        if (!keepAttributes.includes(attrName)) {
          element.removeAttribute(attrName);
        }
      });

      // Clean class attribute - keep only meaningful classes
      const className = element.getAttribute('class');
      if (className) {
        const meaningfulClasses = className
          .split(' ')
          .filter(cls => {
            const lowerCls = cls.toLowerCase();
            return (
              lowerCls.includes('button') ||
              lowerCls.includes('btn') ||
              lowerCls.includes('link') ||
              lowerCls.includes('nav') ||
              lowerCls.includes('menu') ||
              lowerCls.includes('cookie') ||
              lowerCls.includes('consent') ||
              lowerCls.includes('privacy') ||
              lowerCls.includes('banner') ||
              lowerCls.includes('modal') ||
              lowerCls.includes('popup') ||
              lowerCls.includes('gallery') ||
              lowerCls.includes('image') ||
              lowerCls.includes('photo') ||
              lowerCls.includes('more') ||
              lowerCls.includes('expand') ||
              lowerCls.includes('show') ||
              lowerCls.includes('load')
            );
          });
        
        if (meaningfulClasses.length > 0) {
          element.setAttribute('class', meaningfulClasses.join(' '));
        } else {
          element.removeAttribute('class');
        }
      }
    });

    // Remove empty elements (but keep structural ones)
    const structuralTags = ['div', 'section', 'article', 'main', 'nav', 'header', 'footer', 'aside', 'ul', 'ol', 'li'];
    allElements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      if (!structuralTags.includes(tagName) && 
          !element.textContent?.trim() && 
          !element.querySelector('img, button, input, a')) {
        element.remove();
      }
    });

    // Get the cleaned HTML - focus on body content
    const bodyContent = document.body?.innerHTML || document.documentElement.innerHTML;
    
    // Further compress by removing excessive whitespace
    return bodyContent
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

  } catch (error) {
    console.error('Error cleaning DOM:', error);
    // Fallback: basic cleanup with regex
    return htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Enhanced image extraction with dynamic DOM analysis
 */
export async function enhancedImageExtraction(page: Page): Promise<ExtractedImage[]> {
  try {
    console.log('Starting dynamic image extraction...');

    // Get current DOM content for analysis
    const rawDomContent = await page.content();
    
    // Clean DOM content before sending to AI
    console.log('Cleaning DOM content for AI analysis...');
    const cleanedDomContent = cleanDOMForAnalysis(rawDomContent);
    console.log(`DOM size reduced from ${rawDomContent.length} to ${cleanedDomContent.length} characters`);
    
    // Analyze cleaned DOM for interactive elements
    const analysis = await analyzeDOMForInteraction(cleanedDomContent);
    
    console.log("analysis", analysis)

    if (!analysis) {
      console.log('No interactive elements found, proceeding with basic extraction');
      return await extractImagesFromPage(page);
    }

    const { xpath, needCookies } = analysis;

    if (!xpath) {
      console.log('No XPath found, proceeding with basic extraction');
      return await extractImagesFromPage(page);
    }

    if (needCookies) {
      console.log('Cookie banner detected, accepting cookies...');
      try {
        await page.waitForTimeout(2000);
        await page.locator(`xpath=${xpath}`).click();
        console.log('Successfully accepted cookies');
        
        // Wait a bit for the page to update after accepting cookies
        await page.waitForTimeout(3000);
        
        // Re-analyze DOM for image expansion buttons after accepting cookies
        const updatedRawDomContent = await page.content();
        const updatedCleanedDomContent = cleanDOMForAnalysis(updatedRawDomContent);
        const updatedAnalysis = await analyzeDOMForInteraction(updatedCleanedDomContent);

        console.log("updatedAnalysis", updatedAnalysis)
        
        if (updatedAnalysis && updatedAnalysis.xpath && !updatedAnalysis.needCookies) {
          console.log('Found image expansion button after accepting cookies...');
          try {
            await page.locator(`xpath=${updatedAnalysis.xpath}`).click();
            console.log('Successfully clicked image expansion button');
            await page.waitForTimeout(3000);
          } catch (clickError) {
            console.log('Could not click image expansion button after cookies, continuing with basic extraction');
          }
        }
      } catch (cookieError) {
        console.log('Could not accept cookies, continuing with basic extraction');
      }
    } else {
      console.log('Image expansion button detected, clicking...');
      try {
        await page.waitForTimeout(2000);
        await page.locator(`xpath=${xpath}`).click();
        console.log('Successfully clicked image expansion button');
        await page.waitForTimeout(3000);
      } catch (clickError) {
        console.log('Could not click image expansion button, continuing with basic extraction');
      }
    }

    console.log('Extracting images after interactions...');
    
    // Extract images after all interactions
    const imagesAfter = await extractImagesFromPage(page);
    console.log(`Images found after dynamic interactions: ${imagesAfter.length}`);

    return imagesAfter;

  } catch (error) {
    console.error('Error in enhanced image extraction:', error);
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
  connectUrl: string
): Promise<ExtractedImage[]> {
  let browser: Browser | null = null;

  console.log("extractBackgroundImages", connectUrl)

  try {
    const { browser: browserInstance, page } = await initializeBrowser(connectUrl);
    browser = browserInstance;
    
    // No need for page.goto - we're already on the page from Phase 1
    // Just run enhanced image extraction on the current page
    return await enhancedImageExtraction(page);

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
    
    // Extract enhanced images
    const images = await enhancedImageExtraction(page);

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