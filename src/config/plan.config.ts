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
    monthlyPrice: 29.99,
    annualPrice: 24.99,
    credits: 300,
    priceId: {
      month: { 
        euros: process.env.NODE_ENV === "development" ? "price_1QWQfDD0Qr1zHqqnBDvyguMU" : "price_1Ov8PNKpSZUQc1hkHYSsyOBs",
        dollars: process.env.NODE_ENV === "development" ? "price_1QWQfDD0Qr1zHqqnBDvyguMU" : "price_1Q1cN0KpSZUQc1hk9ADCbERe",
      },
      annual: {
        euros: process.env.NODE_ENV === "development" ? "price_1QWQhfD0Qr1zHqqn8lq2PkT2" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
        dollars: process.env.NODE_ENV === "development" ? "price_1QWQhfD0Qr1zHqqn8lq2PkT2" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
      },
    },
    features: [
      '1 membres',
      'Durée maximale de 1 minute',
      'Sous titres automatiques',
      'Voix de hautes qualités',
      'Avatar photo réaliste',
    ]
  },
  {
    name: PlanName.PRO,
    icon: "Heart",
    monthlyPrice: 129.99,
    annualPrice: 99.99,
    credits: 1000,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQfgD0Qr1zHqqnHsTnnGV4" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQfgD0Qr1zHqqnHsTnnGV4" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQiED0Qr1zHqqn90y9WBC2" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQiED0Qr1zHqqn90y9WBC2" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
    },
    features: [
        '2 membres',
        'Durée maximale de 3 minutes',
        'Créer une vidéo à partir d\'un article',
        'Ajoutes automatiquement tes medias',
        'Brand kit'
    ],
    popular: true
  },
  {
    name: PlanName.ENTREPRISE,
    icon: "Gem",
    monthlyPrice: 349.99,
    annualPrice: 299.99,
    credits: 3000,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQgBD0Qr1zHqqnQ6nOgzRi" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQgBD0Qr1zHqqnQ6nOgzRi" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1QWQinD0Qr1zHqqnkDKErYzd" : "price_1Ov8PSKpSZUQc1hkMyQAJg2D",
            dollars: process.env.NODE_ENV === "development" ? "price_1QWQinD0Qr1zHqqnkDKErYzd" : "price_1Q1cNLKpSZUQc1hkF7QBkZZP",
        },
    },
    features: [
      '5 membres',
      'Durée maximale de 5 minutes',
      'Clonage de voix',
      'Clonage avatar',
      'Sauvegarder des templates'
    ]
  }
]