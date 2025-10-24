"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step7Props {
  errors?: Record<string, boolean>
}

const tones = ["expert-reassuring", "inspiring-human", "dynamic-sales", "pedagogic-clear", "emotional-authentic"]
const toneKeys = ["expert-reassuring", "inspiring-human", "dynamic-sales", "pedagogic-clear", "emotional-authentic"]

export default function Step7PreferredTone({ errors = {} }: Step7Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();
  const t = useTranslations('onboarding.step7');

  const handleToneToggle = async (tone: string) => {
    const currentTones = dataCompany.preferredTone;
    const newTones = currentTones.includes(tone)
      ? currentTones.filter(t => t !== tone)
      : [...currentTones, tone];
    await updateCompanyData({ preferredTone: newTones });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.preferredTone && <p className="text-xs text-red-500">{t('preferred-tone-error')}</p>}

      <div className="grid grid-cols-1 gap-3">
        {tones.map((tone, index) => (
          <button
            key={tone}
            onClick={() => handleToneToggle(tone)}
            className={`relative overflow-hidden rounded-lg border p-4 text-left transition-all duration-200 transform hover:scale-[1.01] ${
              dataCompany.preferredTone.includes(tone)
                ? "border-primary bg-primary text-black"
                : errors.preferredTone
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10 font-medium">{t(`tones.${toneKeys[index]}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
