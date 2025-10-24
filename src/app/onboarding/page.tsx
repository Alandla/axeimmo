"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import OnboardingLayout from "@/src/components/onboarding/onboarding-layout"
import Step1PersonalInfo from "@/src/components/onboarding/steps/step1-personal-info"
import Step2AgencyName from "@/src/components/onboarding/steps/step2-agency-name"
import Step3AgencyStatus from "@/src/components/onboarding/steps/step3-agency-status"
import Step4GeographicZone from "@/src/components/onboarding/steps/step4-geographic-zone"
import Step5PropertyTypes from "@/src/components/onboarding/steps/step5-property-types"
import Step6TargetClients from "@/src/components/onboarding/steps/step6-target-clients"
import Step7PreferredTone from "@/src/components/onboarding/steps/step7-preferred-tone"
import Step8AgencyDetails from "@/src/components/onboarding/steps/step8-agency-details"
import Step9LogoUpload from "@/src/components/onboarding/steps/step9-logo-upload"
import ThankYou from "@/src/components/onboarding/steps/thank-you"
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons"
import { useToast } from "@/src/hooks/use-toast"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"
import { Button } from "@/src/components/ui/button"
import { identify } from '@/src/utils/mixpanel'
import AffiliateTracker from "@/src/lib/referral"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const t = useTranslations('onboarding.common')
  
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
  const [storeInitialized, setStoreInitialized] = useState(false);

  const totalSteps = 9
  const isCompleted = currentStep > totalSteps
  
  useEffect(() => {
    if (session?.user && session.user.hasFinishedOnboarding) {
      router.push('/dashboard')
    }
    if (session?.user && !storeInitialized) {
      if (session.user.id && session.user.email) {
        identify(session.user.id, {
          Email: session.user.email,
          name: session.user?.name,
          hasFinishedOnboarding: false,
        });
      }
      
      initStore().then(() => {
        setStoreInitialized(true);
      }).catch(error => {
        console.error("Error on onboarding initialization:", error)
        toast({
          title: "Error on onboarding initialization",
          description: "An error occurred",
          variant: "destructive",
        })
      })
    }
  }, [session, storeInitialized])

  const nextStep = () => {
    setAttemptedNext(true)
    
    if (validateCurrentStep()) {
      goToNextStep(session?.user?.email || undefined)
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
          <Step2AgencyName
            errors={attemptedNext ? errors : {}}
          />
        )
      case 3:
        return (
          <Step3AgencyStatus
            errors={attemptedNext ? errors : {}}
          />
        )
      case 4:
        return (
          <Step4GeographicZone 
            errors={attemptedNext ? errors : {}} 
          />
        )
      case 5:
        return (
          <Step5PropertyTypes
            errors={attemptedNext ? errors : {}}
          />
        )
      case 6:
        return (
          <Step6TargetClients 
            errors={attemptedNext ? errors : {}} 
          />
        )
      case 7:
        return (
          <Step7PreferredTone
            errors={attemptedNext ? errors : {}}
          />
        )
      case 8:
        return <Step8AgencyDetails />
      case 9:
        return <Step9LogoUpload />
      case 10:
        return <ThankYou />
      default:
        return null
    }
  }

  return (
    <>
      <AffiliateTracker />
      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        category={getStepCategory()}
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
                <div className="flex flex-col md:flex-row justify-between mt-4">
                  <Button
                    onClick={prevStep}
                    className={`w-full md:w-auto ${currentStep === 1 ? "opacity-0" : ""}`}
                    variant="outline"
                    size="lg"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('back')}
                  </Button>

                  <Button
                    onClick={nextStep}
                    className="w-full md:w-auto mt-2 md:mt-0"
                    variant="default"
                    size="lg"
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
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </OnboardingLayout>
    </>
  )
}

