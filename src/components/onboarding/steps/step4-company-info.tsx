"use client"

import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"

interface Step4Props {
  formData: {
    companyName: string
    website: string
  }
  updateFormData: (data: Partial<{ companyName: string; website: string }>) => void
  errors?: Record<string, boolean>
}

export default function Step4CompanyInfo({ formData, updateFormData, errors = {} }: Step4Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Company Information</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex justify-between">
            <span>Company name</span>
            {errors.companyName && <span className="text-xs text-red-500">Required</span>}
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => updateFormData({ companyName: e.target.value })}
            placeholder="Company name"
            className={errors.companyName ? "border-red-500" : ""}
          />
          {errors.companyName && <p className="text-xs text-red-500 mt-1">Company name is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">
            Website <span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
      </div>
    </div>
  )
}

