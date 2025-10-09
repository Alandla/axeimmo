'use client'

import { Star, Heart, Diamond, Gem, Loader2, PhoneCall, Users, Clock, Music, Mic, User, Video, Layout, Palette, Save, BookOpen, Film, Layers, ArrowRight, Database, Globe, Sparkles, Link2, Plug } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { useTranslations } from 'next-intl'
import { PlanName } from '../types/enums'
import Link from 'next/link'
import DiscountBanner from './discount-banner'
import PlanPeriodToggle from './plan-period-toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { formatBytes } from '../utils/format'
import { usePricing } from '../hooks/use-pricing'

// Définition des fonctionnalités avec leurs catégories pour remplacer plan.features
export const features = [
  {
    category: "Core Features",
    items: [
      {
        name: "watermark-removal",
        start: true,
        pro: true,
        enterprise: true,
        soon: false,
        tooltip: "Remove the Hoox watermark from all your exported videos, ensuring a professional and branded look.",
        icon: <Layers className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "number-users",
        start: "1",
        pro: "2",
        enterprise: "5",
        soon: false,
        tooltip: "The number of team members that can collaborate in a single workspace with their own accounts.",
        icon: <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "max-video-duration",
        start: "1 minute",
        pro: "3 minutes",
        enterprise: "5 minutes",
        soon: false,
        tooltip: "The maximum length of video you can export with each plan, allowing for more comprehensive content as you upgrade.",
        icon: <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
    ],
  },
  {
    category: "Content Libraries",
    items: [
      {
        name: "music-library",
        start: "Full access",
        pro: "Full access",
        enterprise: "Full access",
        soon: false,
        tooltip: "Access our extensive library of royalty-free background music to enhance your videos with the perfect soundtrack.",
        icon: <Music className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "voices-library",
        start: "20",
        pro: "+100",
        enterprise: "+120",
        soon: false,
        tooltip: "Choose from our collection of ultra-realistic AI voice-overs in multiple languages and accents for your video narration.",
        icon: <Mic className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "avatars-library",
        start: "88",
        pro: "+150",
        enterprise: "+150",
        soon: false,
        tooltip: "Select from our diverse range of lifelike AI avatars to present your video content without needing to film yourself.",
        icon: <User className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
    ],
  },
  {
    category: "Advanced Features",
    items: [
      {
        name: "assets-generation-30",
        start: false,
        pro: true,
        enterprise: false,
        soon: false,
        icon: <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "assets-generation-full",
        start: false,
        pro: false,
        enterprise: true,
        soon: false,
        icon: <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "ai-model-ultra",
        start: false,
        pro: false,
        enterprise: true,
        soon: false,
        tooltip: "Access to our most advanced AI model for superior video generation quality and enhanced performance.",
        icon: <Gem className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "api-access",
        start: false,
        pro: false,
        enterprise: true,
        soon: false,
        tooltip: "Access to our API for superior video generation quality and enhanced performance.",
        icon: <Plug className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "web",
        start: true,
        pro: true,
        enterprise: true,
        soon: false,
        icon: <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "url-to-video",
        start: true,
        pro: true,
        enterprise: true,
        soon: false,
        icon: <Link2 className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "voice-cloning",
        start: false,
        pro: false,
        enterprise: "On demand",
        soon: false,
        tooltip: "Create a digital clone of your voice from just 2 minutes of recorded audio, allowing you to generate voiceovers that sound exactly like you.",
        icon: <Mic className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "digital-clone",
        start: false,
        pro: false,
        enterprise: "On demand",
        soon: false,
        tooltip: "Create a personalized AI avatar that looks and speaks like you, enabling you to produce videos without filming yourself each time.",
        icon: <User className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "save-templates",
        start: false,
        pro: true,
        enterprise: true,
        soon: false,
        tooltip: "Save time by creating reusable templates for video elements like custom subtitles, intros, and outros for consistent branding.",
        icon: <Save className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "smart-media-placement",
        start: false,
        pro: true,
        enterprise: true,
        soon: false,
        tooltip: "Our AI automatically selects and places your uploaded or generated media assets in your video based on context and content.",
        icon: <Layout className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "brand-kit",
        start: false,
        pro: true,
        enterprise: true,
        tooltip: "Personalize your videos with your brand's logo, colors, fonts and other visual elements stored in one place for consistent branding.",
        icon: <Palette className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "ai-video-b-rolls",
        start: false,
        pro: true,
        enterprise: true,
        soon: true,
        tooltip: "Generate contextually relevant B-roll footage with AI to enhance your videos with supporting visuals that match your content perfectly.",
        icon: <Video className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
    ],
  },
  {
    category: "AI Agents",
    items: [
      {
        name: "social-media-agent",
        start: false,
        pro: true,
        enterprise: true,
        soon: true,
        tooltip: "Our AI agent creates a customized content calendar tailored to your brand's voice and target audience for optimal engagement.",
        icon: <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "video-producer-agent",
        start: false,
        pro: "1/day",
        enterprise: "3/day",
        soon: true,
        tooltip: "This agent automatically generates ready-to-publish videos based on your content strategy without requiring manual creation.",
        icon: <Film className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
      {
        name: "community-manager-agent",
        start: false,
        pro: false,
        enterprise: true,
        soon: true,
        tooltip: "This agent automates posting your videos across social media platforms at optimal times with platform-specific descriptions for maximum reach.",
        icon: <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />,
      },
    ],
  },
];

export default function PricingPage({ isSimplified = false }: { isSimplified?: boolean }) {
  const tPlan = useTranslations('plan')
  const tPricing = useTranslations('pricing')
  
  // Utilisation du hook partagé
  const {
    isAnnual,
    setIsAnnual,
    loadingPlan,
    currency,
    setCurrency,
    getCurrencySymbol,
    handlePayment,
    getButtonProps,
    getPlanPrice,
    getSavePercentage,
    plans,
    discount
  } = usePricing()

  return (
    <div className="container my-auto mx-auto px-4 sm:max-w-7xl">
      
      {discount.active && !isSimplified && (
        <DiscountBanner />
      )}

      {!isSimplified && (
        <div className="flex justify-end mb-6">
          <Link 
            href="https://www.hoox.video/compare-plans"
            target="_blank"
            className="inline-flex items-center text-primary hover:text-primary/80 gap-1 text-sm font-medium"
          >
            {tPricing('see-detailed-comparison')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mb-8 flex justify-between items-center">
        <div className="hidden lg:block w-[100px]">
          {/* Empty div to balance the layout on desktop */}
        </div>
        
        {/* Desktop layout */}
        <div className="hidden md:block w-full max-w-md">
          <PlanPeriodToggle 
            isAnnual={isAnnual} 
            onToggle={setIsAnnual} 
            fullWidth={true}
          />
        </div>
        
        {/* Mobile layout */}
        <div className="flex md:hidden items-center justify-between w-full gap-4">
          <PlanPeriodToggle 
            isAnnual={isAnnual} 
            onToggle={setIsAnnual} 
            compact={true}
          />
          
          {/* Mobile currency selector with symbols only */}
          <div className="flex items-center gap-1 border rounded-md h-[42px]">
            <button 
              className={`px-3 h-full rounded-l-md text-sm font-medium ${currency === "USD" ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
              onClick={() => setCurrency("USD")}
            >
              $
            </button>
            <button 
              className={`px-3 h-full rounded-r-md text-sm font-medium ${currency === "EUR" ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
              onClick={() => setCurrency("EUR")}
            >
              €
            </button>
          </div>
        </div>
        
        {/* Desktop currency selector */}
        <div className="hidden md:block w-[100px]">
          <Select
            value={currency}
            onValueChange={setCurrency}
            defaultValue="USD"
          >
            <SelectTrigger className="w-[100px] h-[42px]">
              <SelectValue placeholder="Devise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
        {plans.map((plan) => {
          const discountedPrice = getPlanPrice(plan);
          const buttonProps = getButtonProps(plan.name, tPricing)
          const savePercentage = getSavePercentage(plan);
          
          return (
            <div key={plan.name} className="flex-1 w-full">
              <Card 
                className={`relative w-full ${
                  plan.popular ? 'bg-black text-white' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-[#FB5688] text-white text-xs rounded-full">
                    {tPricing('popular')}
                  </div>
                )}
                {savePercentage > 0 && (
                  <div className={`absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full ${
                    plan.popular ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                    {tPricing('save')} {savePercentage}%
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-white' : 'bg-primary'}`}>
                      {plan.icon === "Star" && <Star className="h-6 w-6 text-[#FB5688]" />}
                      {plan.icon === "Heart" && <Heart className="h-6 w-6 text-[#FB5688]" />}
                      {plan.icon === "Gem" && <Gem className="h-6 w-6 text-[#FB5688]" />}
                    </div>
                    <CardTitle>{tPlan(plan.name)}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-4xl font-bold">{Math.floor(discountedPrice)}{getCurrencySymbol()}</span>
                    <div className="flex flex-col text-sm -space-y-1">
                      <span className={`line-through ${savePercentage > 0 ? '' : 'opacity-0'}`}>{plan.monthlyPrice}{getCurrencySymbol()}</span>
                      <span className="text-sm text-muted-foreground">/{tPricing('month')}{isAnnual && `, ${tPricing('billed-annually')}`}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className={`w-full mb-4 ${
                      plan.name === PlanName.START 
                        ? 'bg-white text-black border border-gray-300 hover:bg-gray-100' 
                        : plan.popular 
                          ? 'bg-white text-black hover:bg-gray-100' 
                          : ''
                    }`}
                    onClick={() => handlePayment(plan, 'pricing_page')}
                    disabled={loadingPlan === plan.name || buttonProps.disabled}
                  >
                    {buttonProps.text}
                    {loadingPlan === plan.name ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                  <div className="border-t my-4" />
                  
                  {/* Informations de base */}
                  <div className="mb-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Layers className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">
                        <span className="font-bold">{plan.credits}</span> {tPricing('credits')} 
                        <span className="text-muted-foreground ml-1">
                          ({plan.credits === 150 && tPricing('150-credits')}
                          {plan.credits === 400 && tPricing('400-credits')}
                          {plan.credits === 800 && tPricing('800-credits')})
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">
                        {tPricing('avatars-limit', { limit: plan.name === PlanName.ENTREPRISE ? 20 : (plan.name === PlanName.PRO ? 10 : 5) })}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">
                        {formatBytes(plan.storageLimit || 0)} {tPricing('storage')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {tPricing('max-duration')} {plan.maxVideoDuration} {tPricing('minute')}{plan.maxVideoDuration > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium mb-1">{tPricing('features')}</h3>
                    {plan.name !== PlanName.START ? (
                      <p className="text-sm text-muted-foreground">
                        {tPricing('everything-in')} {tPlan(plans[plans.findIndex(p => p.name === plan.name) - 1].name)}, {tPricing('plus')}:
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {tPricing('everything-in')} {tPlan(PlanName.FREE)}, {tPricing('plus')}:
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {features.map((category) => {
                      // Déterminer la clé du plan actuel
                      const planKey = plan.name === PlanName.START 
                        ? "start" 
                        : plan.name === PlanName.PRO 
                          ? "pro" 
                          : "enterprise";
                          
                      // Filtrer les fonctionnalités pertinentes pour ce plan
                      const relevantFeatures = category.items.filter((feature) => {
                        // Exclure les fonctionnalités déjà affichées dans la section de base
                        if (category.category === "Core Features" && 
                           (feature.name === "number-users" || 
                            feature.name === "max-video-duration")) {
                          return false;
                        }
                        
                        // Obtenir la valeur pour ce plan
                        const value = feature[planKey as keyof typeof feature];
                        
                        // Si c'est le plan START, on affiche tout (sauf les exclusions ci-dessus)
                        if (plan.name === PlanName.START && value !== false) {
                          return true;
                        }
                        
                        // Pour les plans supérieurs, vérifier si la fonctionnalité est disponible
                        // et n'est pas déjà disponible dans le plan précédent
                        if (plan.name === PlanName.PRO) {
                          const startValue = feature.start;
                          return value !== false && (startValue === false || value !== startValue);
                        }
                        
                        if (plan.name === PlanName.ENTREPRISE) {
                          const proValue = feature.pro;
                          return value !== false && (proValue === false || value !== proValue);
                        }
                        
                        return false;
                      });
                      
                      // Ne pas afficher la catégorie s'il n'y a pas de fonctionnalités à afficher
                      if (relevantFeatures.length === 0) return null;
                      
                      return (
                        <li key={category.category}>
                          <ul className="space-y-2">
                            {relevantFeatures.map((feature) => {
                              const value = feature[planKey as keyof typeof feature];
                              
                              return (
                                <li key={feature.name} className="flex items-start gap-2">
                                  {feature.icon}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <span>{tPricing(`feature.${feature.name}`)}{value !== true && value !== false && ` (${value})`}</span>
                                      {feature.soon && (
                                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full ml-1">
                                          {tPricing('soon')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {!isSimplified && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="flex-row items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Diamond className="h-6 w-6 text-[#FB5688]" />
            </div>
            <div>
              <CardTitle>{tPricing('custom')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {tPricing('need-custom-plan')}
              </p>
            </div>
          </CardHeader>
          <CardFooter>
            <Link href="https://calendar.app.google/FHm4qKBiq43Cr8oK9" target='_blank' className="w-full">
              <Button variant="outline" className="w-full">
                {tPricing('contact-sales')}
                <PhoneCall className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

