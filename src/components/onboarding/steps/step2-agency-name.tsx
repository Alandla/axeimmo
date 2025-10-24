"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step2Props {
  errors?: Record<string, boolean>
}

export default function Step2AgencyName({ errors = {} }: Step2Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step2');

  const handleAgencyNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateCompanyData({ companyName: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('agency-name-label')}
          </label>
          <input
            type="text"
            value={dataCompany.companyName}
            onChange={handleAgencyNameChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.companyName ? "border-red-500" : "border-gray-200"
            }`}
            placeholder={t('agency-name-placeholder')}
          />
          {errors.companyName && (
            <p className="text-xs text-red-500 mt-1">{t('agency-name-error')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
