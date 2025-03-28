import { PlanName } from "../types/enums";
import { Plan } from "../types/plan";

export const discount = {
  active: false,
  mode: "all", // "year" or "month" or "all"
  reduction: 0.8,
  couponId: process.env.NODE_ENV === "development" ? "1prfCTD9": "LFuOJEsa"
}

export const plans: Plan[] = [
  {
    name: PlanName.START,
    icon: "Star",
    monthlyPrice: 20,
    annualPrice: 16,
    credits: 150,
    priceId: {
      month: { 
        euros: process.env.NODE_ENV === "development" ? "price_1R6XrvD0Qr1zHqqnLPT9g4BF" : "price_1R6XvsD0Qr1zHqqnz0NQiI4L",
        dollars: process.env.NODE_ENV === "development" ? "price_1R6XrvD0Qr1zHqqnLPT9g4BF" : "price_1R6XvsD0Qr1zHqqnz0NQiI4L",
      },
      annual: {
        euros: process.env.NODE_ENV === "development" ? "price_1R6XtpD0Qr1zHqqnrXbs0lxG" : "price_1R6XvvD0Qr1zHqqnSdM5OmFC",
        dollars: process.env.NODE_ENV === "development" ? "price_1R6XtpD0Qr1zHqqnrXbs0lxG" : "price_1R6XvvD0Qr1zHqqnSdM5OmFC",
      },
    },
    features: [
      'feature.1-member',
      'feature.watermark-removal',
      'feature.duration-1-max',
      'feature.voice-1',
      'feature.avatar-1',
    ]
  },
  {
    name: PlanName.PRO,
    icon: "Heart",
    monthlyPrice: 50,
    annualPrice: 40,
    credits: 400,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1R5Au9D0Qr1zHqqnwu1SThl7" : "price_1R6Xw0D0Qr1zHqqnkcpYlQTP",
            dollars: process.env.NODE_ENV === "development" ? "price_1R5Au9D0Qr1zHqqnwu1SThl7" : "price_1R6Xw0D0Qr1zHqqnkcpYlQTP",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1R5AwAD0Qr1zHqqns7ebzcjd" : "price_1R6XwwD0Qr1zHqqnQYnsZbRT",
            dollars: process.env.NODE_ENV === "development" ? "price_1R5AwAD0Qr1zHqqns7ebzcjd" : "price_1R6XwwD0Qr1zHqqnQYnsZbRT",
        },
    },
    features: [
        'feature.2-members',
        'feature.duration-3-max',
        'feature.brand-kit',
        'feature.voice-2',
        'feature.avatar-2',
    ],
    popular: true
  },
  {
    name: PlanName.ENTREPRISE,
    icon: "Gem",
    monthlyPrice: 100,
    annualPrice: 80,
    credits: 800,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1R5AuYD0Qr1zHqqnC0aVFLmN" : "price_1R6XwsD0Qr1zHqqnxSzXWLST",
            dollars: process.env.NODE_ENV === "development" ? "price_1R5AuYD0Qr1zHqqnC0aVFLmN" : "price_1R6XwsD0Qr1zHqqnxSzXWLST",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1R5AwbD0Qr1zHqqniklVk7Vp" : "price_1R6XwyD0Qr1zHqqnS7hI9Xh8",
            dollars: process.env.NODE_ENV === "development" ? "price_1R5AwbD0Qr1zHqqniklVk7Vp" : "price_1R6XwyD0Qr1zHqqnS7hI9Xh8",
        },
    },
    features: [
      'feature.5-members',
      'feature.duration-5-max',
      'feature.voice-cloning',
      'feature.voice-3',
      'feature.save-template'
    ]
  }
]