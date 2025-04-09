"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import OnboardingLayout from "@/src/components/onboarding/onboarding-layout"
import Step1PersonalInfo from "@/src/components/onboarding/steps/step1-personal-info"
import Step2Role from "@/src/components/onboarding/steps/step2-role"
import Step3Discovery from "@/src/components/onboarding/steps/step3-discovery"
import Step4CompanyInfo from "@/src/components/onboarding/steps/step4-company-info"
import Step5Goal from "@/src/components/onboarding/steps/step5-goal"
import Step6CompanyType from "@/src/components/onboarding/steps/step6-company-type"
import Step7CompanySales from "@/src/components/onboarding/steps/step7-company-sales"
import Step8CompanyDetails from "@/src/components/onboarding/steps/step8-company-details"
import ThankYou from "@/src/components/onboarding/steps/thank-you"
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons"
import { useToast } from "@/src/hooks/use-toast"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const t = useTranslations('onboarding.common')
  const tCategories = useTranslations('onboarding.categories')
  
  // Utilisation du store zustand pour l'onboarding
  const {
    isLoading,
    currentStep,
    errors,
    hasCompleted,
    initStore,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    getStepCategory
  } = useOnboardingStore()
  
  // État local pour la gestion des tentatives de validation
  const [attemptedNext, setAttemptedNext] = useState(false)

  const totalSteps = 8
  const isCompleted = currentStep > totalSteps
  
  useEffect(() => {
    if (session?.user) {
      if (session.user.hasFinishedOnboarding) {
        router.push('/dashboard')
      }
    }
  }, [session, router])

  useEffect(() => {
    if (session?.user) {
      // Initialisation du store avec les données du serveur
      initStore().then(() => {
      }).catch(error => {
        console.error("Erreur lors de l'initialisation:", error)
        toast({
          title: "Erreur",
          description: "Une erreur est survenue",
          variant: "destructive",
        })
      })
    }
  }, [session])

  const nextStep = () => {
    setAttemptedNext(true)
    
    if (validateCurrentStep()) {
      goToNextStep()
      setAttemptedNext(false)
      return true
    }
    return false
  }

  const prevStep = () => {
    goToPreviousStep()
    setAttemptedNext(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PersonalInfo
            errors={attemptedNext ? errors : {}} 
          />
        )
      case 2:
        return (
          <Step2Role
            errors={attemptedNext ? errors : {}}
          />
        )
      case 3:
        return (
          <Step3Discovery
            errors={attemptedNext ? errors : {}}
          />
        )
      case 4:
        return (
          <Step4CompanyInfo 
            errors={attemptedNext ? errors : {}} 
          />
        )
      case 5:
        return (
          <Step5Goal
            errors={attemptedNext ? errors : {}}
          />
        )
      case 6:
        return (
          <Step6CompanyType 
            errors={attemptedNext ? errors : {}} 
          />
        )
      case 7:
        return (
          <Step7CompanySales
            errors={attemptedNext ? errors : {}}
          />
        )
      case 8:
        return <Step8CompanyDetails />
      case 9:
        return <ThankYou />
      default:
        return null
    }
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      category={tCategories(getStepCategory())}
      showProgress={!isCompleted}
    >
      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 min-h-[400px] ">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-[435px] "
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {!isCompleted && (
              <div className="flex justify-between mt-4">
                <button
                  onClick={prevStep}
                  className={`px-4 py-2 rounded-md border border-gray-200 text-sm font-medium flex items-center transition-opacity duration-300 gap-2 ${currentStep === 1 ? "opacity-0" : ""}`}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  {t('back')}
                </button>

                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium flex items-center gap-2"
                >
                  {currentStep === totalSteps ? (
                    <>
                      {t('complete')}
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      {t('continue')}
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </OnboardingLayout>
  )
}

