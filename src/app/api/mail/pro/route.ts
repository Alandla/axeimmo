import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { sendProLeadEmail } from '@/src/lib/loops'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("POST /api/mail/pro by user: ", session.user.id)

  const params = await req.json()
  const { name, firstName, email, role, website, companyName } = params

  if (!name || !firstName || !email || !role || !companyName) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    const result = await sendProLeadEmail({
      name,
      firstName,
      email,
      role,
      website: website || '',
      companyName
    })

    console.log('Professional lead email sent successfully for user:', session.user.id)

    return NextResponse.json({ data: { success: true, result } })
  } catch (error) {
    console.error('Error sending professional lead email:', error)
    return NextResponse.json({ error: 'Failed to send professional lead email' }, { status: 500 })
  }
} 