"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step3Props {
  errors?: Record<string, boolean>
}

const statuses = ["agency", "mandataire", "reseau", "independent"]
const statusKeys = ["agency", "mandataire", "reseau", "independent"]

export default function Step3AgencyStatus({ errors = {} }: Step3Props) {
  const { dataCompany, updateCompanyData, goToNextStep } = useOnboardingStore();
  const t = useTranslations('onboarding.step3');

  const handleSelect = async (status: string) => {
    await updateCompanyData({ status })
    goToNextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.status && <p className="text-xs text-red-500">{t('status-error')}</p>}

      <div className="grid grid-cols-2 gap-4">
        {statuses.map((status, index) => (
          <button
            key={status}
            onClick={() => handleSelect(status)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              dataCompany.status === status
                ? "border-primary bg-primary text-black"
                : errors.status
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10">{t(`statuses.${statusKeys[index]}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
