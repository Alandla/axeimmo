import { NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { getUrlContent, ExaCleanedResponse } from "@/src/lib/exa"

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

    // 5. Traitement des données - Récupérer le contenu de toutes les URLs en parallèle
    const contentPromises = validUrls.map(url => getUrlContent(url))
    const contentResults = await Promise.all(contentPromises)

    // Fusionner les résultats
    const mergedResults: ExaCleanedResponse = {
      results: contentResults.flatMap(result => result.results),
      costDollars: {
        total: contentResults.reduce((total, result) => total + (result.costDollars?.total || 0), 0),
        contents: {
          text: contentResults.reduce((total, result) => total + (result.costDollars?.contents?.text || 0), 0)
        }
      }
    }

    // 6. Retourner les données encapsulées dans 'data'
    return NextResponse.json({
      data: mergedResults
    })
  } catch (error) {
    console.error("Error fetching URL content:", error)
    return NextResponse.json(
      { error: "Error fetching URL content" },
      { status: 500 }
    )
  }
} 