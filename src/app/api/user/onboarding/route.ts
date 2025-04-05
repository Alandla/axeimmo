import { auth } from "@/src/lib/auth"
import { NextResponse } from "next/server"
import { getUserById, updateUser } from "@/src/dao/userDao"
import { OnboardingData } from "@/src/store/onboardingStore"

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

    // Créer l'objet onboardingData complet à partir des données de l'utilisateur
    const onboardingData: OnboardingData = {
      name: user.name || "",
      firstName: user.firstName || "",
      role: user.onboardingData?.role || "",
      discoveryChannel: user.onboardingData?.discoveryChannel || "",
      companyName: user.onboardingData?.companyName || "",
      website: user.onboardingData?.website || "",
      goal: user.onboardingData?.goal || "",
      companyType: user.onboardingData?.companyType || "",
      companySize: user.onboardingData?.companySize || "2-10",
      salesType: user.onboardingData?.salesType || "",
      companyMission: user.onboardingData?.companyMission || "",
      companyGoals: user.onboardingData?.companyGoals || "",
      companyTarget: user.onboardingData?.companyTarget || ""
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

  console.log("POST /api/user/onboarding by user: ", session.user.id);

  try {
    const { onboardingData, hasFinishedOnboarding } = await req.json()

    // Extraire name et firstName des données d'onboarding
    const { name, firstName, ...restOnboardingData } = onboardingData

    console.log("onboardingData: ", onboardingData);
    console.log("hasFinishedOnboarding: ", hasFinishedOnboarding);

    // Créer un objet propre pour la mise à jour en base de données
    const updatedUser = await updateUser(session.user.id, {
      name,
      firstName,
      onboardingData: restOnboardingData,
      hasFinishedOnboarding: hasFinishedOnboarding || false
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Créer l'objet onboardingData complet pour la réponse
    const responseOnboardingData: OnboardingData = {
      name: updatedUser.name || "",
      firstName: updatedUser.firstName || "",
      role: updatedUser.onboardingData?.role || "",
      discoveryChannel: updatedUser.onboardingData?.discoveryChannel || "",
      companyName: updatedUser.onboardingData?.companyName || "",
      website: updatedUser.onboardingData?.website || "",
      goal: updatedUser.onboardingData?.goal || "",
      companyType: updatedUser.onboardingData?.companyType || "",
      companySize: updatedUser.onboardingData?.companySize || "2-10",
      salesType: updatedUser.onboardingData?.salesType || "",
      companyMission: updatedUser.onboardingData?.companyMission || "",
      companyGoals: updatedUser.onboardingData?.companyGoals || "",
      companyTarget: updatedUser.onboardingData?.companyTarget || ""
    }

    return NextResponse.json({
      data: {
        hasFinishedOnboarding: updatedUser.hasFinishedOnboarding,
        onboardingData: responseOnboardingData
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