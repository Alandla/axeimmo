"use client"

import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { Globe } from "lucide-react";
import { TextShimmer } from "@/src/components/ui/text-shimmer";
import { useTranslations } from "next-intl"

interface Step8Props {}

export default function Step8CompanyDetails({}: Step8Props) {
  const { dataCompany, updateCompanyData, fetchingCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step8');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {fetchingCompanyData && (
        <div className="bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm mb-4 flex items-center gap-2">
          <Globe className="w-3 h-3" />
          <TextShimmer className="text-blue-700" duration={1.5}>
            {t('fetching-website')}
          </TextShimmer>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyMission">
            {t('mission-label')} <span className="text-xs text-gray-500">{t('mission-optional')}</span>
          </Label>
          <Textarea
            id="companyMission"
            value={dataCompany.companyMission}
            onChange={(e) => updateCompanyData({ companyMission: e.target.value })}
            placeholder={t('mission-placeholder')}
            rows={3}
            disabled={fetchingCompanyData}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyGoals">
            {t('target-label')} <span className="text-xs text-gray-500">{t('target-optional')}</span>
          </Label>
          <Textarea
            id="companyGoals"
            value={dataCompany.companyTarget}
            onChange={(e) => updateCompanyData({ companyTarget: e.target.value })}
            placeholder={t('target-placeholder')}
            rows={3}
            disabled={fetchingCompanyData}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            {t('needs-label')}<span className="text-xs text-gray-500">{t('needs-optional')}</span>
          </Label>
          <Textarea
            id="additionalInfo"
            value={dataCompany.companyNeeds}
            onChange={(e) => updateCompanyData({ companyNeeds: e.target.value })}
            placeholder={t('needs-placeholder')}
            rows={3}
            disabled={fetchingCompanyData}
          />
        </div>
      </div>
    </div>
  )
}

