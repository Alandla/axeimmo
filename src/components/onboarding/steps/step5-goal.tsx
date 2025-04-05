"use client"

import { motion } from "framer-motion"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step5Props {
  errors?: Record<string, boolean>
}

const goals = ["Organic growth", "Ads creation", "Brand Awareness", "Lead Generation", "Faceless Content"]

export default function Step5Goal({ errors = {} }: Step5Props) {
  const { dataUser, updateUserData, goToNextStep } = useOnboardingStore();

  const handleSelect = (goal: string) => {
    updateUserData({ goal })
    goToNextStep()
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
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all duration-200 transform hover:scale-[1.02] ${
              dataUser.goal === goal
                ? "border-black bg-black text-white"
                : errors.goal
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="relative z-10">{goal}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 