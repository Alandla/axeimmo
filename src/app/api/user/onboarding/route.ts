import { auth } from "@/src/lib/auth"
import { NextResponse } from "next/server"
import { getUserById, updateUser } from "@/src/dao/userDao"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await getUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // On combine les données d'onboarding avec name et firstName
    const onboardingData = {
      ...user.onboardingData,
      name: user.name || "",
      firstName: user.firstName || "",
    }

    return NextResponse.json({
      data: {
        hasFinishedOnboarding: user.hasFinishedOnboarding,
        onboardingData
      }
    })
  } catch (error) {
    console.error("Error fetching user onboarding data:", error)
    return NextResponse.json(
      { error: "Error fetching user onboarding data" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("PUT /api/user/onboarding by user: ", session.user.id);

  try {
    const { onboardingData, hasFinishedOnboarding } = await req.json()

    // On extrait name et firstName des données d'onboarding
    const { name, firstName, ...restOnboardingData } = onboardingData

    console.log("onboardingData: ", onboardingData);
    console.log("hasFinishedOnboarding: ", hasFinishedOnboarding);

    const updatedUser = await updateUser(session.user.id, {
      name,
      firstName,
      onboardingData: restOnboardingData,
      hasFinishedOnboarding: hasFinishedOnboarding || false
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // On renvoie les données combinées pour la cohérence
    const combinedOnboardingData = {
      ...updatedUser.onboardingData,
      name: updatedUser.name || "",
      firstName: updatedUser.firstName || "",
    }

    return NextResponse.json({
      data: {
        hasFinishedOnboarding: updatedUser.hasFinishedOnboarding,
        onboardingData: combinedOnboardingData
      }
    })
  } catch (error) {
    console.error("Error updating user onboarding data:", error)
    return NextResponse.json(
      { error: "Error updating user onboarding data" },
      { status: 500 }
    )
  }
} 