import { auth } from "@/src/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { website } = body

    if (!website) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 })
    }

    // Créer des données fictives basées sur le hash du domaine
    const fakeCompanyInfo = {
      description: 'a super company',
      audience: 'young audience',
      goals: 'virality on social media',
    }

    return NextResponse.json({
      data: fakeCompanyInfo
    })
  } catch (error) {
    console.error("Error fetching company info:", error)
    return NextResponse.json(
      { error: "Error fetching company info" },
      { status: 500 }
    )
  }
} 