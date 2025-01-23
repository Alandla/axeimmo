import { PlanName } from "../types/enums";
import { Plan } from "../types/plan";

export const discount = {
    active: true,
    mode: "all", // "year" or "month" or "all"
    reduction: 0.7,
    couponId: process.env.NODE_ENV === "development" ? "U4LfTMD1": "lwHMUSmY"
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
        euros: process.env.NODE_ENV === "development" ? "price_1QX6A8D0Qr1zHqqn7h90G8bZ" : "price_1QXCL0D0Qr1zHqqnNwcefcjk",
        dollars: process.env.NODE_ENV === "development" ? "price_1QX6A8D0Qr1zHqqn7h90G8bZ" : "price_1QXCL0D0Qr1zHqqnNwcefcjk",
      },
      annual: {
        euros: process.env.NODE_ENV === "development" ? "price_1QWQhfD0Qr1zHqqn8lq2PkT2" : "price_1QXCL6D0Qr1zHqqnsGJoZ6qB",
        dollars: process.env.NODE_ENV === "development" ? "price_1QWQhfD0Qr1zHqqn8lq2PkT2" : "price_1QXCL6D0Qr1zHqqnsGJoZ6qB",
      },
    },
    features: [
      'feature.1-member',
      'feature.duration-1-max',
      'feature.watermark-removal',
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
            euros: process.env.NODE_ENV === "development" ? "price_1QX6AjD0Qr1zHqqneSlnDCmJ" : "price_1QXCL2D0Qr1zHqqnCguPrThP",
            dollars: process.env.NODE_ENV === "development" ? "price_1QX6AjD0Qr1zHqqneSlnDCmJ" : "price_1QXCL2D0Qr1zHqqnCguPrThP",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQiED0Qr1zHqqn90y9WBC2" : "price_1QXCL8D0Qr1zHqqnasb0n9be",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQiED0Qr1zHqqn90y9WBC2" : "price_1QXCL8D0Qr1zHqqnasb0n9be",
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
            euros: process.env.NODE_ENV === "development" ? "price_1QX6B7D0Qr1zHqqndebSCju6" : "price_1QXCL4D0Qr1zHqqn5s2SSof6",
            dollars: process.env.NODE_ENV === "development" ? "price_1QX6B7D0Qr1zHqqndebSCju6" : "price_1QXCL4D0Qr1zHqqn5s2SSof6",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQinD0Qr1zHqqnkDKErYzd" : "price_1QXCL9D0Qr1zHqqnc50W9aKG",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQinD0Qr1zHqqnkDKErYzd" : "price_1QXCL9D0Qr1zHqqnc50W9aKG",
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