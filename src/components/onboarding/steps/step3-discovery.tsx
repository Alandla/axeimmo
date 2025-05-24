"use client"

import { motion } from "framer-motion"
import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"

interface Step3Props {
  errors?: Record<string, boolean>
}

const channels = ["Linkedin", "Youtube", "X", "Instagram", "TikTok", "Google", "Friends", "Other"]
const channelKeys = ["linkedin", "youtube", "x", "instagram", "tiktok", "google", "friends", "other"]

export default function Step3Discovery({ errors = {} }: Step3Props) {
  const { dataUser, updateUserData, goToNextStep } = useOnboardingStore();
  const t = useTranslations('onboarding.step3');

  const handleSelect = (channel: string) => {
    updateUserData({ discoveryChannel: channel })
    goToNextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {errors.discoveryChannel && <p className="text-xs text-red-500">{t('channel-error')}</p>}

      <div className="grid grid-cols-3 gap-4">
        {channels.map((channel, index) => (
          <button
            key={channel}
            onClick={() => handleSelect(channel)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              dataUser.discoveryChannel === channel
                ? "border-primary bg-primary text-white"
                : errors.discoveryChannel
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10">{t(`channels.${channelKeys[index]}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

