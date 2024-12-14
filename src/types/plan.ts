import { PlanName } from "./enums"

export interface Plan {
  name: PlanName
  icon: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  popular?: boolean
}