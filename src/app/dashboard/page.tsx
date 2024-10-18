import SignOutButton from "@/src/components/sign-out-button"
import { auth } from "@/src/lib/auth"
import { signOut } from "next-auth/react"
import { redirect } from "next/navigation"

export default async function Dashboard() {
    const session = await auth()

    if (!session) {
        redirect('/')
    }
    console.log(session)

    return (
        <div>
            <h1>Dashboard</h1>
            <SignOutButton />
        </div>
    )
}