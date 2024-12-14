import { Avatar } from "../types/avatar";
import { PlanName } from "../types/enums";
import { Plan } from "../types/plan";
import { Star, Heart, Diamond, Check, Gem, ArrowRight } from 'lucide-react'

export const plans: Plan[] = [
  {
    name: PlanName.CREATOR,
    icon: "Star",
    monthlyPrice: 29.99,
    annualPrice: 24.99,
    features: [
      '300 crédits',
      'Durée maximale de 1 minute',
      '1 membres',
      'Sous titres automatiques',
      'Voix de hautes qualités',
      'Avatar photo réaliste',
      'Delivery of invoices'
    ]
  },
  {
    name: PlanName.PRO,
    icon: "Heart",
    monthlyPrice: 129.99,
    annualPrice: 99.99,
    features: [
        '1.000 crédits',
        'Toutes les fonctionnalités du plan créateur',
        'Durée maximale de 3 minutes',
        '2 membres',
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
    features: [
      '3.000 crédits',
      'Toutes les fonctionnalités du plan créateur',
      'Durée maximale de 5 minutes',
      '5 membres',
      'Clonage de voix',
      'Clonage avatar',
      'Sauvegarder des templates'
    ]
  }
]