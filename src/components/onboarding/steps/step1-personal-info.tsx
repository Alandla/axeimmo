"use client"

import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step1Props {
  errors?: Record<string, boolean>
}

export default function Step1PersonalInfo({ errors = {} }: Step1Props) {
  const { dataUser, updateUserData } = useOnboardingStore();
  const t = useTranslations('onboarding.step1');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex justify-between">
            <span>{t('name-label')}</span>
          </Label>
          <Input
            id="name"
            value={dataUser.name}
            onChange={(e) => updateUserData({ name: e.target.value })}
            placeholder={t('name-label')}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{t('name-error')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex justify-between">
            <span>{t('firstName-label')}</span>
          </Label>
          <Input
            id="firstName"
            value={dataUser.firstName}
            onChange={(e) => updateUserData({ firstName: e.target.value })}
            placeholder={t('firstName-label')}
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{t('firstName-error')}</p>}
        </div>
      </div>
    </div>
  )
}

