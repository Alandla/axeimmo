"use client"

import { motion } from "framer-motion"

interface Step6Props {
  formData: {
    salesType: string
  }
  updateFormData: (data: Partial<{ salesType: string }>) => void
  onSelect: () => void
  errors?: Record<string, boolean>
}

const salesTypes = ["Products", "Services", "Nothing"]

export default function Step6CompanySales({ formData, updateFormData, onSelect, errors = {} }: Step6Props) {
  const handleSelect = (type: string) => {
    updateFormData({ salesType: type })
    onSelect()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">You sell...</h2>

      {errors.salesType && <p className="text-xs text-red-500">Please select what you sell</p>}

      <div className="grid grid-cols-3 gap-4">
        {salesTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
              formData.salesType === type
                ? "border-black bg-black text-white"
                : errors.salesType
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {formData.salesType === type && (
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

