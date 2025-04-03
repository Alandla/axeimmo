"use client"

import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"

interface Step7Props {
  formData: {
    companyMission: string
    companyGoals: string
    additionalInfo: string
  }
  updateFormData: (
    data: Partial<{
      companyMission: string
      companyGoals: string
      additionalInfo: string
    }>,
  ) => void
}

export default function Step7CompanyDetails({ formData, updateFormData }: Step7Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tell us more about your company</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyMission">
            What is your company's mission? <span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="companyMission"
            value={formData.companyMission}
            onChange={(e) => updateFormData({ companyMission: e.target.value })}
            placeholder="Describe your company's mission..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyGoals">
            What are your main goals with our platform? <span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="companyGoals"
            value={formData.companyGoals}
            onChange={(e) => updateFormData({ companyGoals: e.target.value })}
            placeholder="Describe your goals..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            Anything else you'd like to share? <span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => updateFormData({ additionalInfo: e.target.value })}
            placeholder="Additional information..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

