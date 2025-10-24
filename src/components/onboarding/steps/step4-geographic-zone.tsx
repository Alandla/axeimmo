"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step4Props {
  errors?: Record<string, boolean>
}

export default function Step4GeographicZone({ errors = {} }: Step4Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step4');

  const handleGeographicZoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateCompanyData({ geographicZone: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('geographic-zone-label')}
          </label>
          <input
            type="text"
            value={dataCompany.geographicZone}
            onChange={handleGeographicZoneChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.geographicZone ? "border-red-500" : "border-gray-200"
            }`}
            placeholder={t('geographic-zone-placeholder')}
          />
          {errors.geographicZone && (
            <p className="text-xs text-red-500 mt-1">{t('geographic-zone-error')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
