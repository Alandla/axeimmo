import { PlanName } from "./enums"

export type Voice = {
    id: string
    name: string
    language: string,
    age: string,
    gender: 'male' | 'female'
    accent: string
    tags: string[]
    previewUrl: string
    plan: PlanName
    voiceSettings?: {
        stability: number
        similarity_boost: number
    }
}