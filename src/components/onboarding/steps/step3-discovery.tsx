"use client"

import { motion } from "framer-motion"

interface Step3Props {
  formData: {
    discoveryChannel: string
  }
  updateFormData: (data: Partial<{ discoveryChannel: string }>) => void
  onSelect: () => void
  errors?: Record<string, boolean>
}

const channels = ["Linkedin", "Youtube", "X", "Instagram", "TikTok", "Google", "Friends", "Other"]

export default function Step3Discovery({ formData, updateFormData, onSelect, errors = {} }: Step3Props) {
  const handleSelect = (channel: string) => {
    updateFormData({ discoveryChannel: channel })
    onSelect()
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
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
              formData.discoveryChannel === channel
                ? "border-black bg-black text-white"
                : errors.discoveryChannel
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {formData.discoveryChannel === channel && (
              <motion.div
                layoutId="selectedChannel"
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <span className="relative z-10">{channel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

