import { PlanName } from "../types/enums";
import { Plan } from "../types/plan";

export const discount = {
    active: false,
    mode: "all", // "year" or "month" or "all"
    reduction: 0.7,
    couponId: process.env.NODE_ENV === "development" ? "1YBiW3m8": "Qt0xCHqJ"
}

export const plans: Plan[] = [
  {
    name: PlanName.CREATOR,
    icon: "Star",
    monthlyPrice: 35,
    annualPrice: 30,
    credits: 250,
    priceId: {
      month: { 
        euros: process.env.NODE_ENV === "development" ? "price_1QX6A8D0Qr1zHqqn7h90G8bZ" : "price_1Ov8PNKpSZUQc1hkHYSsyOBs",
        dollars: process.env.NODE_ENV === "development" ? "price_1QX6A8D0Qr1zHqqn7h90G8bZ" : "price_1Q1cN0KpSZUQc1hk9ADCbERe",
      },
      annual: {
        euros: process.env.NODE_ENV === "development" ? "price_1QWQhfD0Qr1zHqqn8lq2PkT2" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
        dollars: process.env.NODE_ENV === "development" ? "price_1QWQhfD0Qr1zHqqn8lq2PkT2" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
      },
    },
    features: [
      'feature.1-member',
      'feature.duration-1-max',
      'feature.subtitles',
      'feature.voice',
      'feature.avatar',
    ]
  },
  {
    name: PlanName.PRO,
    icon: "Heart",
    monthlyPrice: 99,
    annualPrice: 79,
    credits: 1000,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1QX6AjD0Qr1zHqqneSlnDCmJ" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QX6AjD0Qr1zHqqneSlnDCmJ" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQiED0Qr1zHqqn90y9WBC2" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQiED0Qr1zHqqn90y9WBC2" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
    },
    features: [
        'feature.2-members',
        'feature.duration-3-max',
        'feature.create-article',
        'feature.add-media',
        'feature.brand-kit'
    ],
    popular: true
  },
  {
    name: PlanName.ENTREPRISE,
    icon: "Gem",
    monthlyPrice: 299,
    annualPrice: 249,
    credits: 3000,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1QX6B7D0Qr1zHqqndebSCju6" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QX6B7D0Qr1zHqqndebSCju6" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQinD0Qr1zHqqnkDKErYzd" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQinD0Qr1zHqqnkDKErYzd" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
    },
    features: [
      'feature.5-members',
      'feature.duration-5-max',
      'feature.voice-cloning',
      'feature.avatar-clone',
      'feature.save-template'
    ]
  }
]