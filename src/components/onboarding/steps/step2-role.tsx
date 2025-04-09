"use client"

import { motion } from "framer-motion"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step2Props {
  errors?: Record<string, boolean>
}

const roles = ["Owner", "Marketing", "Sales", "Social Media", "Communication"]
const roleKeys = ["owner", "marketing", "sales", "social-media", "communication"]

export default function Step2Role({ errors = {} }: Step2Props) {
  const { dataUser, updateUserData, goToNextStep } = useOnboardingStore();
  const t = useTranslations('onboarding.step2');

  const handleSelect = (role: string) => {
    updateUserData({ role })
    goToNextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.role && <p className="text-xs text-red-500">{t('role-error')}</p>}

      <div className="grid grid-cols-2 gap-4">
        {roles.map((role, index) => (
          <button
            key={role}
            onClick={() => handleSelect(role)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              dataUser.role === role
                ? "border-black bg-black text-white"
                : errors.role
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10">{t(`roles.${roleKeys[index]}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

