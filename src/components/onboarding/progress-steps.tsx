"use client"

import { motion } from "framer-motion"

interface ProgressStepsProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressSteps({ currentStep, totalSteps }: ProgressStepsProps) {
  const progressWidth = `${(currentStep / totalSteps) * 100}%`

  return (
    <div className="relative flex gap-2 items-center h-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex-1 h-2 bg-gray-200 rounded-full" />
      ))}

      <motion.div
        className="absolute left-0 top-0 h-2 bg-black rounded-full"
        style={{ width: progressWidth }}
        initial={{ width: 0 }}
        animate={{ width: progressWidth }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
}

