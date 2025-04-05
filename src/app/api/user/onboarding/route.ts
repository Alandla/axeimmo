import { auth } from "@/src/lib/auth"
import { NextResponse } from "next/server"
import { getUserById, updateUser } from "@/src/dao/userDao"
import { UserOnboardingData } from "@/src/store/onboardingStore"
import { getSpaceById } from "@/src/dao/spaceDao"
import { objectIdToString } from "@/src/lib/utils"

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

    const userData: UserOnboardingData = {
      name: user.name || "",
      firstName: user.firstName || "",
      role: user.role || "",
      discoveryChannel: user.discoveryChannel || "",
      goal: user.goal || ""
    }

    let spaceDetails = {};
    if (user.spaces && user.spaces.length > 0) {
      const spaceId = objectIdToString(user.spaces[0]);
      
      const space = await getSpaceById(spaceId);
      if (space && space.details) {
        spaceDetails = space.details;
      }
    }
    const response = {
      hasFinishedOnboarding: user.hasFinishedOnboarding,
      userData,
      spaceDetails
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error("Error fetching user onboarding data:", error)
    return NextResponse.json(
      { error: "Error fetching user onboarding data" },
      { status: 500 }
    )
  }
}