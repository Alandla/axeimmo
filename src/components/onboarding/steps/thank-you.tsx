"use client"

import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function ThankYou() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <CheckCircle className="w-10 h-10 text-green-600" />
      </motion.div>

      <motion.h2
        className="text-4xl font-bold mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Thank you!
      </motion.h2>

      <motion.p
        className="text-lg text-gray-600 max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Your onboarding is complete. We're excited to have you on board and can't wait to help you achieve your goals.
      </motion.p>
    </motion.div>
  )
}

