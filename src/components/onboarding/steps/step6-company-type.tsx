"use client"

import { motion } from "framer-motion"
import { Slider } from "@/src/components/ui/slider"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step6Props {
  errors?: Record<string, boolean>
}

const companyTypes = ["Agency", "E-commerce", "SaaS", "Content Creator", "Non-profit", "Other"]
const companySizes = ["Solo", "2-10", "11-50", "51-100", "+100"]

export default function Step6CompanyType({ errors = {} }: Step6Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();

  const handleSelectType = (type: string) => {
    updateCompanyData({ companyType: type })
  }

  const handleSizeChange = (value: number[]) => {
    updateCompanyData({ companySize: companySizes[value[0]] })
  }

  const currentSizeIndex = companySizes.findIndex((size) => size === dataCompany.companySize)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">You are...</h2>

        {errors.companyType && <p className="text-xs text-red-500">Please select your company type</p>}

        <div className="grid grid-cols-2 gap-4">
          {companyTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleSelectType(type)}
              className={`relative overflow-hidden rounded-lg border p-4 text-center transition-all ${
                dataCompany.companyType === type
                  ? "border-black bg-black text-white"
                  : errors.companyType
                    ? "border-red-500 hover:border-red-600"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {dataCompany.companyType === type && (
                <motion.div
                  layoutId="selectedType"
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

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Company size</h3>

        <div className="space-y-4">
          <Slider
            defaultValue={[currentSizeIndex !== -1 ? currentSizeIndex : 1]}
            max={companySizes.length - 1}
            step={1}
            onValueChange={handleSizeChange}
            className="w-full"
          />

          <div className="text-2xl font-bold">{dataCompany.companySize}</div>
        </div>
      </div>
    </div>
  )
}

