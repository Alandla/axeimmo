"use client"

import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"

interface Step1Props {
  formData: {
    name: string
    firstName: string
  }
  updateFormData: (data: Partial<{ name: string; firstName: string }>) => void
  errors?: Record<string, boolean>
}

export default function Step1PersonalInfo({ formData, updateFormData, errors = {} }: Step1Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Let's personalise your experience</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex justify-between">
            <span>Name</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex justify-between">
            <span>First Name</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            placeholder="First Name"
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">First name is required</p>}
        </div>
      </div>
    </div>
  )
}

