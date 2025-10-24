"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step8Props {
  errors?: Record<string, boolean>
}

export default function Step8AgencyDetails({ errors = {} }: Step8Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step8');

  const handleCoreValuesChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    await updateCompanyData({ coreValues: e.target.value });
  };

  const handleSignaturePhraseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateCompanyData({ signaturePhrase: e.target.value });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">{t('core-values-title')}</h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('core-values-label')}
          </label>
          <textarea
            value={dataCompany.coreValues}
            onChange={handleCoreValuesChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('core-values-placeholder')}
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">{t('signature-phrase-title')}</h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('signature-phrase-label')}
          </label>
          <input
            type="text"
            value={dataCompany.signaturePhrase}
            onChange={handleSignaturePhraseChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('signature-phrase-placeholder')}
          />
        </div>
      </div>
    </div>
  )
}
