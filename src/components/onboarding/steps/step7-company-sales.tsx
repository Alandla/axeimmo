"use client"

import { motion } from "framer-motion"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step7Props {
  errors?: Record<string, boolean>
}

const salesTypes = ["Products", "Services", "Software", "Nothing"]

export default function Step7CompanySales({ errors = {} }: Step7Props) {
  const { data, updateData, goToNextStep } = useOnboardingStore();

  const handleSelect = (salesType: string) => {
    updateData({ salesType })
    goToNextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">You sell...</h2>

      {errors.salesType && <p className="text-xs text-red-500">Please select what you sell</p>}

      <div className="grid grid-cols-2 gap-4">
        {salesTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
              data.salesType === type
                ? "border-black bg-black text-white"
                : errors.salesType
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {data.salesType === type && (
              <motion.div
                layoutId="selectedSalesType"
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <span className="relative z-10">{type}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

