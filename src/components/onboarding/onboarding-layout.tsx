import Image from "next/image"
import type { ReactNode } from "react"
import FeatureShowcase from "@/src/components/onboarding/feature-showcase"
import ProgressSteps from "@/src/components/onboarding/progress-steps"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/src/components/ui/button"

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
  const t = useTranslations('onboarding.layout');
  const isCompleted = currentStep > totalSteps;

  return (
    <div className="flex min-h-screen overflow-hidden relative">
      {/* Logo persistant qui change de couleur */}
      <AnimatePresence mode="popLayout">
        {isCompleted ? (
          <motion.div 
            className="absolute top-8 left-8 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            key="logo-black"
          >
            <Image src="/logo-noir.png" alt="Hoox" width={120} height={40} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Bouton de fermeture qui apparaît lorsque l'onboarding est terminé */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            className="absolute top-4 right-4 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 2, duration: 0.3 }}
          >
            <Link href="/dashboard/create">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 bg-white shadow-sm hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar avec animation uniquement lors de la disparition */}
      <motion.div 
        className="w-80 bg-black text-white p-8 flex flex-col"
        initial={false} // Pas d'animation initiale
        animate={{
          width: isCompleted ? "0px" : "320px", // 80px = 20rem = w-80
          padding: isCompleted ? "0px" : "2rem",
          opacity: isCompleted ? 0 : 1
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
      >
        <div className="mb-12">
          <Image src="/logo-blanc.png" alt="Hoox" width={120} height={40} className="mb-12" />
          <div className="space-y-1">
            <h2 className="text-sm font-medium uppercase tracking-wider">{t('get-started')}</h2>
            <h1 className="text-4xl font-bold">{t('welcome')}</h1>
            <p className="text-sm text-gray-400 mt-2">
              {t('gateway-description')}
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
      </motion.div>

      {/* Main content */}
      <motion.div 
        className="flex-1 bg-white rounded-tl-3xl rounded-bl-3xl p-12 flex flex-col"
        initial={false} // Pas d'animation initiale
        animate={{
          borderTopLeftRadius: isCompleted ? "0px" : "1.5rem",
          borderBottomLeftRadius: isCompleted ? "0px" : "1.5rem",
          width: isCompleted ? "100%" : "auto"
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
      >
        <div className="mx-auto w-full flex-1 flex flex-col">
          {showProgress && (
            <div className="max-w-xl mx-auto w-full">
              <div className="text-sm text-gray-500 mb-2">{category}</div>
              <ProgressSteps currentStep={currentStep} totalSteps={totalSteps} />
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`w-full ${isCompleted ? "max-w-none" : "max-w-md"}`}>{children}</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

