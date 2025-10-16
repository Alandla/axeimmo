import { PlanName } from "./enums"

export interface Plan {
  name: PlanName
  icon: string
  monthlyPrice: number
  annualPrice: number
  credits: number
  users: number
  maxVideoDuration: number
  storageLimit?: number
  popular?: boolean
  imageToVideoLimit: number
  avatarsLimit: number
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