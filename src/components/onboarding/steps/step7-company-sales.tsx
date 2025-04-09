"use client"

import { motion } from "framer-motion"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step7Props {
  errors?: Record<string, boolean>
}

const salesTypes = ["products", "services", "software", "nothing"]

export default function Step7CompanySales({ errors = {} }: Step7Props) {
  const { dataCompany, updateCompanyData, goToNextStep } = useOnboardingStore();
  const t = useTranslations('onboarding.step7');

  const handleSelect = (salesType: string) => {
    updateCompanyData({ salesType })
    goToNextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.salesType && <p className="text-xs text-red-500">{t('salesType-error')}</p>}

      <div className="grid grid-cols-2 gap-4">
        {salesTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
              dataCompany.salesType === type
                ? "border-black bg-black text-white"
                : errors.salesType
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10">{t(`salesTypes.${type}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

