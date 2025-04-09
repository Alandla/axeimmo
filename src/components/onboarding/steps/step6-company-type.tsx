"use client"

import { Slider } from "@/src/components/ui/slider"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step6Props {
  errors?: Record<string, boolean>
}

const companyTypes = ["agency", "ecommerce", "saas", "content-creator", "non-profit", "other"]
const companySizes = ["Solo", "2-10", "11-50", "51-100", "+100"]

export default function Step6CompanyType({ errors = {} }: Step6Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step6');

  const currentSizeIndex = companySizes.findIndex((size) => size === dataCompany.companySize)

  const handleSelectCompanyType = (companyType: string) => {
    let salesType = dataCompany.salesType;
    if (!salesType) {
      salesType = "nothing";
      if (companyType === "agency") {
        salesType = "services";
      } else if (companyType === "ecommerce") {
        salesType = "products";  
      } else if (companyType === "saas") {
        salesType = "software";
      }
      updateCompanyData({ salesType, companyType })
    } else {
      updateCompanyData({ companyType })
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>

        {errors.companyType && <p className="text-xs text-red-500">{t('companyType-error')}</p>}

        <div className="grid grid-cols-2 gap-4">
          {companyTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleSelectCompanyType(type)}
              className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
                dataCompany.companyType === type
                  ? "border-black bg-black text-white"
                  : errors.companyType
                    ? "border-red-500 hover:border-red-600"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="relative z-10">{t(`companyTypes.${type}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">{t('companySize-title')}</h3>

        <div className="space-y-4">
          <Slider
            defaultValue={[currentSizeIndex !== -1 ? currentSizeIndex : 1]}
            max={companySizes.length - 1}
            step={1}
            onValueChange={(value) => updateCompanyData({ companySize: companySizes[value[0]] })}
            className="w-full"
          />

          <div className="text-2xl font-bold">{dataCompany.companySize}</div>
        </div>
      </div>
    </div>
  )
}

