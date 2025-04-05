"use client"

import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step4Props {
  errors?: Record<string, boolean>
}

export default function Step4CompanyInfo({ errors = {} }: Step4Props) {
  const { data, updateData } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tell us about your company</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex justify-between">
            <span>Company Name</span>
          </Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            placeholder="Your company name"
            className={errors.companyName ? "border-red-500" : ""}
          />
          {errors.companyName && <p className="text-xs text-red-500 mt-1">Company name is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex justify-between">
            <span>Website (optional)</span>
          </Label>
          <Input
            id="website"
            value={data.website}
            onChange={(e) => updateData({ website: e.target.value })}
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>
    </div>
  )
}

