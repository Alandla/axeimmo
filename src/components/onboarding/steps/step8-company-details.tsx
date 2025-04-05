"use client"

import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step8Props {}

export default function Step8CompanyDetails({}: Step8Props) {
  const { data, updateData } = useOnboardingStore();

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
            value={data.companyMission}
            onChange={(e) => updateData({ companyMission: e.target.value })}
            placeholder="Describe your company's mission..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyGoals">
            Who is your target audience? <span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="companyGoals"
            value={data.companyGoals}
            onChange={(e) => updateData({ companyGoals: e.target.value })}
            placeholder="Describe your goals..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            What are your main goals with our platform?<span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="additionalInfo"
            value={data.companyGoals}
            onChange={(e) => updateData({ companyGoals: e.target.value })}
            placeholder="Additional information..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

