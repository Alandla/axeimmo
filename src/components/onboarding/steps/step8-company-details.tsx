"use client"

import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { useOnboardingStore } from "@/src/store/onboardingStore"

interface Step8Props {}

export default function Step8CompanyDetails({}: Step8Props) {
  const { dataCompany, updateCompanyData } = useOnboardingStore();

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
            value={dataCompany.companyMission}
            onChange={(e) => updateCompanyData({ companyMission: e.target.value })}
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
            value={dataCompany.companyTarget}
            onChange={(e) => updateCompanyData({ companyTarget: e.target.value })}
            placeholder="Describe your goals..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            What makes you want to use Hoox?<span className="text-xs text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="additionalInfo"
            value={dataCompany.companyNeeds}
            onChange={(e) => updateCompanyData({ companyNeeds: e.target.value })}
            placeholder="Describe how Hoox can help you to achieve your goals..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

