"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step5Props {
  errors?: Record<string, boolean>
}

const propertyTypes = ["prestige", "familial", "urbain", "rural", "investissement", "commercial"]
const propertyTypeKeys = ["prestige", "familial", "urbain", "rural", "investissement", "commercial"]

export default function Step5PropertyTypes({ errors = {} }: Step5Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step5');

  const handlePropertyTypeToggle = async (propertyType: string) => {
    const currentTypes = dataCompany.propertyTypes;
    const newTypes = currentTypes.includes(propertyType)
      ? currentTypes.filter(type => type !== propertyType)
      : [...currentTypes, propertyType];
    await updateCompanyData({ propertyTypes: newTypes });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.propertyTypes && <p className="text-xs text-red-500">{t('property-types-error')}</p>}

      <div className="grid grid-cols-2 gap-3">
        {propertyTypes.map((type, index) => (
          <button
            key={type}
            onClick={() => handlePropertyTypeToggle(type)}
            className={`relative overflow-hidden rounded-lg border p-3 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              dataCompany.propertyTypes.includes(type)
                ? "border-primary bg-primary text-black"
                : errors.propertyTypes
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10 text-sm">{t(`property-types.${propertyTypeKeys[index]}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
