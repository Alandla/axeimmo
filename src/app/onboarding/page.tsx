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
import { basicApiGetCall, basicApiCall } from "@/src/lib/api"

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal information
    name: "",
    firstName: "",
    role: "",
    discoveryChannel: "",

    // Company information
    companyName: "",
    website: "",
    goal: "",
    companyType: "",
    companySize: "2-10",
    salesType: "",
    companyMission: "",
    companyGoals: "",
    additionalInfo: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [attemptedNext, setAttemptedNext] = useState(false)

  const totalSteps = 8
  const isCompleted = currentStep > totalSteps

  useEffect(() => {
    const fetchOnboardingData = async () => {
      try {
        const data = await basicApiGetCall<{
          hasFinishedOnboarding: boolean;
          onboardingData: typeof formData | null;
        }>("/user/onboarding")

        if (data.hasFinishedOnboarding) {
          router.push("/dashboard")
          return
        }

        if (data.onboardingData) {
          setFormData(data.onboardingData)
          const calculatedStep = calculateCurrentStep(data.onboardingData)
          setCurrentStep(calculatedStep)
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error)
        toast({
          title: "Erreur",
          description: "Une erreur est survenue",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchOnboardingData()
    }
  }, [session, router, toast])

  const calculateCurrentStep = (data: typeof formData) => {
    // Step 1: Personal Info
    if (!data.name || !data.firstName) return 1
    
    // Step 2: Role
    if (!data.role) return 2
    
    // Step 3: Discovery
    if (!data.discoveryChannel) return 3
    
    // Step 4: Company Info
    if (!data.companyName) return 4
    
    // Step 5: Goal
    if (!data.goal) return 5
    
    // Step 6: Company Type
    if (!data.companyType) return 6
    
    // Step 7: Sales Type
    if (!data.salesType) return 7
    
    // Step 8: Company Details (optional)
    return 8
  }

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }))

    // Clear errors for updated fields
    const updatedErrors = { ...errors }
    Object.keys(data).forEach((key) => {
      if (updatedErrors[key]) {
        delete updatedErrors[key]
      }
    })
    setErrors(updatedErrors)
  }

  const validateCurrentStep = () => {
    const newErrors: Record<string, boolean> = {}

    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) newErrors.name = true
        if (!formData.firstName.trim()) newErrors.firstName = true
        break
      case 2:
        if (!formData.role) newErrors.role = true
        break
      case 3:
        if (!formData.discoveryChannel) newErrors.discoveryChannel = true
        break
      case 4:
        if (!formData.companyName.trim()) newErrors.companyName = true
        // Website is optional
        break
      case 5:
        if (!formData.goal) newErrors.goal = true
        break
      case 6:
        if (!formData.companyType) newErrors.companyType = true
        // Company size has default value
        break
      case 7:
        if (!formData.salesType) newErrors.salesType = true
        break
      case 8:
        // All fields in step 8 are optional
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveOnboardingData = async (isComplete = false) => {
    try {
      await basicApiCall("/user/onboarding", {
        onboardingData: formData,
        hasFinishedOnboarding: isComplete
      })
    } catch (error) {
      console.error("Error saving onboarding data:", error)
      // On affiche le toast uniquement si c'est la dernière étape
      if (isComplete) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder vos données",
          variant: "destructive",
        })
      }
    }
  }

  const nextStep = () => {
    setAttemptedNext(true)
    if (validateCurrentStep() && currentStep <= totalSteps) {
      const nextStepNumber = currentStep + 1
      const isComplete = nextStepNumber > totalSteps

      // On change d'étape immédiatement
      setCurrentStep(nextStepNumber)
      setAttemptedNext(false)

      // On sauvegarde en arrière-plan
      saveOnboardingData(isComplete)

      // Si c'était la dernière étape, on redirige vers le dashboard
      if (isComplete) {
        router.push("/dashboard")
      }
    }
  }

  const handleStepSelect = (data: Partial<typeof formData>) => {
    // On met à jour les données
    setFormData(prev => ({ ...prev, ...data }))

    // On passe à l'étape suivante
    const nextStepNumber = currentStep + 1
    const isComplete = nextStepNumber > totalSteps

    setCurrentStep(nextStepNumber)
    setAttemptedNext(false)

    // On sauvegarde en arrière-plan avec les données mises à jour
    saveOnboardingData(isComplete)

    if (isComplete) {
      router.push("/dashboard")
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      setAttemptedNext(false) // Reset for next step
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PersonalInfo formData={formData} updateFormData={updateFormData} errors={attemptedNext ? errors : {}} />
        )
      case 2:
        return (
          <Step2Role
            formData={formData}
            updateFormData={updateFormData}
            onSelect={() => handleStepSelect({ role: formData.role })}
            errors={attemptedNext ? errors : {}}
          />
        )
      case 3:
        return (
          <Step3Discovery
            formData={formData}
            updateFormData={updateFormData}
            onSelect={() => handleStepSelect({ discoveryChannel: formData.discoveryChannel })}
            errors={attemptedNext ? errors : {}}
          />
        )
      case 4:
        return (
          <Step4CompanyInfo formData={formData} updateFormData={updateFormData} errors={attemptedNext ? errors : {}} />
        )
      case 5:
        return (
          <Step5Goal
            formData={formData}
            updateFormData={updateFormData}
            onSelect={() => handleStepSelect({ goal: formData.goal })}
            errors={attemptedNext ? errors : {}}
          />
        )
      case 6:
        return (
          <Step6CompanyType formData={formData} updateFormData={updateFormData} errors={attemptedNext ? errors : {}} />
        )
      case 7:
        return (
          <Step7CompanySales
            formData={formData}
            updateFormData={updateFormData}
            onSelect={() => handleStepSelect({ salesType: formData.salesType })}
            errors={attemptedNext ? errors : {}}
          />
        )
      case 8:
        return <Step8CompanyDetails formData={formData} updateFormData={updateFormData} />
      case 9:
        return <ThankYou />
      default:
        return null
    }
  }

  const getStepCategory = () => {
    if (currentStep <= 3) return "Personal Information"
    if (currentStep <= 7) return "Company Information"
    return ""
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      category={getStepCategory()}
      showProgress={!isCompleted}
    >
      <div className="min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {!isCompleted && (
              <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                {currentStep > 1 ? (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 rounded-md border border-gray-200 text-sm font-medium flex items-center gap-2"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium flex items-center gap-2"
                >
                  {currentStep === totalSteps ? (
                    <>
                      Complete
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue
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

