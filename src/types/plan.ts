import { PlanName } from "./enums"

export interface Plan {
  name: PlanName
  icon: string
  monthlyPrice: number
  annualPrice: number
  credits: number
  features: string[]
  popular?: boolean
  priceId: {
    month: { 
      euros: string
      dollars: string
    },
    annual: {
      euros: string
      dollars: string
    }
  }
}