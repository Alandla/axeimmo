import { auth } from "@/src/lib/auth"
import { redirect } from "next/navigation"

export default async function LayoutPrivate({ children }: Readonly<{children: React.ReactNode}>) {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  if (!session.user?.hasFinishedOnboarding) {
    redirect('/onboarding');
  }

  return (
    <>
      {children}
    </>
  );
}
