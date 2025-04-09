import { auth } from "@/src/lib/auth"
import { getCompanyInfo } from "@/src/lib/exa"
import { summarizeCompany } from "@/src/lib/ai"
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

    //Extract the domain from the website
    let cleanUrl = website.trim().toLowerCase();
    
    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Parse URL
    const parsedUrl = new URL(cleanUrl);
    
    // Get domain without www.
    const domain = parsedUrl.hostname.replace(/^www\./, '');
    
    // Additional validation: domain should have at least one dot and no spaces
    if (!domain.includes('.') || domain.includes(' ')) {
      return NextResponse.json({ error: "Invalid website URL" }, { status: 400 })
    }

    const companyInfo = await getCompanyInfo(domain)

    const companySummary = await summarizeCompany(companyInfo)

    return NextResponse.json({
      data: companySummary
    })
  } catch (error) {
    console.error("Error fetching company info:", error)
    return NextResponse.json(
      { error: "Error fetching company info" },
      { status: 500 }
    )
  }
} 