"use client"

import { motion } from "framer-motion"

interface Step5Props {
  formData: {
    goal: string
  }
  updateFormData: (data: Partial<{ goal: string }>) => void
  onSelect: () => void
  errors?: Record<string, boolean>
}

const goals = ["Organic growth", "Ads creation", "UGC", "Monetization", "Faceless Content"]

export default function Step5Goal({ formData, updateFormData, onSelect, errors = {} }: Step5Props) {
  const handleSelect = (goal: string) => {
    updateFormData({ goal })
    onSelect()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your goal with Hoox</h2>

      {errors.goal && <p className="text-xs text-red-500">Please select your goal</p>}

      <div className="grid grid-cols-3 gap-4">
        {goals.map((goal) => (
          <button
            key={goal}
            onClick={() => handleSelect(goal)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
              formData.goal === goal
                ? "border-black bg-black text-white"
                : errors.goal
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {formData.goal === goal && (
              <motion.div
                layoutId="selectedGoal"
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <span className="relative z-10">{goal}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 