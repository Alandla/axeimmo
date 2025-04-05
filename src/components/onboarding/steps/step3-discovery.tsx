"use client"

import { motion } from "framer-motion"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step3Props {
  errors?: Record<string, boolean>
}

const channels = ["Linkedin", "Youtube", "X", "Instagram", "TikTok", "Google", "Friends", "Other"]

export default function Step3Discovery({ errors = {} }: Step3Props) {
  const { data, updateData, goToNextStep } = useOnboardingStore();

  const handleSelect = (channel: string) => {
    updateData({ discoveryChannel: channel })
    goToNextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">How did you hear about us?</h2>

      {errors.discoveryChannel && <p className="text-xs text-red-500">Please select how do you find us</p>}

      <div className="grid grid-cols-3 gap-4">
        {channels.map((channel) => (
          <button
            key={channel}
            onClick={() => handleSelect(channel)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              data.discoveryChannel === channel
                ? "border-black bg-black text-white"
                : errors.discoveryChannel
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10">{channel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

