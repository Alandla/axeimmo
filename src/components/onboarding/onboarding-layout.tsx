import Image from "next/image"
import type { ReactNode } from "react"
import FeatureShowcase from "@/src/components/onboarding/feature-showcase"
import ProgressSteps from "@/src/components/onboarding/progress-steps"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  category: string
  showProgress?: boolean
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  category,
  showProgress = true,
}: OnboardingLayoutProps) {
  const tFooter = useTranslations('footer');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-black text-white p-8 flex flex-col">
        <div className="mb-12">
          <Image src="/logo-blanc.png" alt="HOOK" width={120} height={40} className="mb-12" />
          <div className="space-y-1">
            <h2 className="text-sm font-medium uppercase tracking-wider">GET STARTED</h2>
            <h1 className="text-4xl font-bold">Welcome</h1>
            <p className="text-sm text-gray-400 mt-2">
              Your gateway for your gateway to accelerated video content creation.
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <FeatureShowcase />
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-500 w-full mt-8 pt-4 border-t border-gray-800">
          <div className="flex justify-between">
            <Link href="/privacy-policy" className="hover:underline">{tFooter('privacy')}</Link>
            <Link href="/tos" className="hover:underline">{tFooter('terms')}</Link>
          </div>
          <p>{tFooter('rights').replace('2024', new Date().getFullYear().toString())}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-white rounded-tl-3xl rounded-bl-3xl p-12 flex flex-col">
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
          {showProgress && (
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">{category}</div>
              <ProgressSteps currentStep={currentStep} totalSteps={totalSteps} />
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

