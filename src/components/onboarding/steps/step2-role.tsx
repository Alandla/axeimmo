"use client"

import { motion } from "framer-motion"

interface Step2Props {
  formData: {
    role: string
  }
  updateFormData: (data: Partial<{ role: string }>) => void
  onSelect: () => void
  errors?: Record<string, boolean>
}

const roles = ["Owner", "Marketing", "Sales", "Social Media", "Communication"]

export default function Step2Role({ formData, updateFormData, onSelect, errors = {} }: Step2Props) {
  const handleSelect = (role: string) => {
    updateFormData({ role })
    onSelect()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">What's your role?</h2>

      {errors.role && <p className="text-xs text-red-500">Please select your role</p>}

      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => handleSelect(role)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
              formData.role === role
                ? "border-black bg-black text-white"
                : errors.role
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {formData.role === role && (
              <motion.div
                layoutId="selectedRole"
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <span className="relative z-10">{role}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

