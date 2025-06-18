import { NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { scrapeUrls, FirecrawlBatchResponse } from "@/src/lib/firecrawl"

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("POST /api/search/url by user:", session.user.id);

  try {
    const body = await req.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs array is required" }, { status: 400 })
    }

    const validUrls = urls.filter(url => {
      try {
        new URL(url)
        return true
      } catch (e) {
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 })
    }

    // Scraper le contenu de toutes les URLs avec Firecrawl
    const scrapedContent: FirecrawlBatchResponse = await scrapeUrls(validUrls)

    // Retourner les données
    return NextResponse.json({
      data: scrapedContent
    })
  } catch (error) {
    console.error("Error fetching URL content:", error)
    return NextResponse.json(
      { error: "Error fetching URL content" },
      { status: 500 }
    )
  }
} 