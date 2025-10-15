'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
} from "@/src/components/ui/dialog"
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { useTranslations } from 'next-intl'
import { PlanName } from '../../types/enums'
import PlanPeriodToggle from '../plan-period-toggle'
import { ArrowRight, Star, Heart, Gem, ShieldCheck, Zap, Mic } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { usePricing } from '../../hooks/use-pricing'

interface ModalPricingProps {
  title?: string
  description?: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  // Configuration personnalisable selon l'endroit où la modal est ouverte
  features?: {
    credits?: boolean
    videoExports?: boolean
    watermarkRemoval?: boolean
    videoMinutes?: boolean
    urlToVideo?: boolean
    imageToVideoLimit?: boolean
  }
  recommendedPlan?: PlanName
  onSeeAllPlans?: () => void
}

export default function ModalPricing({
  title,
  description,
  isOpen,
  setIsOpen,
  features = {
    credits: true,
    videoExports: true,
    watermarkRemoval: true,
    videoMinutes: true,
    urlToVideo: true,
    imageToVideoLimit: true
  },
  recommendedPlan = PlanName.PRO,
  onSeeAllPlans
}: ModalPricingProps) {
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
    getPlanPrice,
    getSavePercentage,
    plans
  } = usePricing()

  // State local pour le plan sélectionné dans la modal
  const [selectedPlan, setSelectedPlan] = useState<PlanName>(recommendedPlan)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Centrer le plan recommandé au montage
  useEffect(() => {
    if (scrollContainerRef.current && isOpen) {
      const container = scrollContainerRef.current
      if (!container) return
      
      const selectedIndex = plans.findIndex(p => p.name === selectedPlan)
      const cardWidth = 220 // Largeur réelle d'une carte (w-[220px])
      const gap = 16 // gap-4 = 16px
      const containerWidth = container.offsetWidth
      const padding = 32 // px-4 md:px-8 approximatif
      
      // Position de la carte sélectionnée
      const cardPosition = selectedIndex * (cardWidth + gap) + padding
      // Centrer la carte dans le container
      const scrollLeft = cardPosition - (containerWidth / 2) + (cardWidth / 2)
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      })

    }
  }, [isOpen, selectedPlan, scrollContainerRef.current])

  const handleSeeAllPlans = () => {
    if (onSeeAllPlans) {
      onSeeAllPlans();
    } else {
      // Redirection par défaut vers la page pricing
      window.open('/dashboard/pricing', '_blank');
    }
  }

  const selectedPlanData = plans.find(p => p.name === selectedPlan);
  const discountedPrice = selectedPlanData ? getPlanPrice(selectedPlanData) : 0;
  const savePercentage = selectedPlanData ? getSavePercentage(selectedPlanData) : 0;

  const getVoiceCount = (planName: PlanName) => {
    switch (planName) {
      case PlanName.START:
        return 20
      case PlanName.PRO:
        return 100
      case PlanName.ENTREPRISE:
        return 120
      default:
        return 20
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <DialogContent 
        className="max-w-3xl h-[90vh] p-0 gap-0 border-0 bg-white rounded-xl overflow-hidden flex flex-col" 
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >
        {/* Header fixe */}
        <div className="px-4 pt-8 md:px-8 md:pt-12 border-b md:border-b-0 bg-white">
          {/* Titre centré avec avatars */}
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              {title || tPricing('modal.title')}
            </h2>
            <p className="text-gray-600 text-xs md:text-sm">
              {description || tPricing('modal.description')}
            </p>
          </div>

          {/* Period Toggle et Currency */}
          <div className="mb-4 flex justify-between items-center">
            <div className="hidden lg:block w-[100px]">
              {/* Empty div to balance the layout on desktop */}
            </div>
            
            {/* Desktop layout */}
            <div className="hidden md:block w-full max-w-sm">
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
              
              {/* Currency selector mobile */}
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
            <div className="hidden md:block">
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
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
            <div 
              ref={scrollContainerRef}
              className="flex pt-6 gap-4 overflow-x-auto overflow-y-visible pb-4 mb-6 px-4 md:px-8 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {plans.map((plan) => {
                const planDiscountedPrice = getPlanPrice(plan);
                const planSavePercentage = getSavePercentage(plan);
                const isSelected = plan.name === selectedPlan;
                
                return (
                  <div 
                    key={plan.name}
                    className={`relative flex-shrink-0 w-[220px] h-[140px] p-4 rounded-xl border-2 cursor-pointer transition-all overflow-visible ${
                      isSelected 
                        ? 'border-[#FB5688] bg-pink-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.name)}
                  >
                    {/* Sélecteur rond */}
                    <div className="absolute top-3 right-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'border-[#FB5688] bg-[#FB5688]' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* Badge populaire */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge variant="plan" className="text-xs">
                          {tPricing('popular')}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Nom du plan */}
                    <div className="flex items-center gap-2 mb-3">
                      {plan.icon === "Star" && <Star className="h-4 w-4 text-[#FB5688]" />}
                      {plan.icon === "Heart" && <Heart className="h-4 w-4 text-[#FB5688]" />}
                      {plan.icon === "Gem" && <Gem className="h-4 w-4 text-[#FB5688]" />}
                      <h3 className="font-bold text-lg text-gray-900">
                        {tPlan(plan.name)}
                      </h3>
                    </div>
                    
                    {/* Prix */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {Math.floor(planDiscountedPrice)}{getCurrencySymbol()}
                        </span>
                        <span className="text-sm text-gray-600">/{tPricing('month')}</span>
                      </div>
                      
                      {/* Billed annually - toujours présent mais invisible si mensuel */}
                      <div className={`text-sm text-gray-500 min-h-[20px] ${!isAnnual ? 'opacity-0' : ''}`}>
                        {tPricing('modal.billed-annually')}
                      </div>
                    </div>
                    
                    {/* Badge économie - toujours présent mais invisible si pas de promotion */}
                    <div className="min-h-[28px]">
                      <Badge 
                        variant={isSelected ? "default" : "warning"} 
                        className={`text-xs ${planSavePercentage === 0 ? 'opacity-0' : ''} ${
                          isSelected 
                            ? 'bg-[#FB5688] text-white border-[#FB5688]' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {tPricing('modal.save-percent', { percent: planSavePercentage })}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Fonctionnalités */}
            <div className="space-y-6 mb-6 px-4 md:px-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {tPricing('modal.what-you-get')}
              </h3>
              
              {/* Export sans watermark */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {tPricing('modal.features.export-no-watermark.title')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {tPricing('modal.features.export-no-watermark.description')}
                  </p>
                </div>
              </div>

              {/* Crédits */}
              {selectedPlanData && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {tPricing('modal.features.credits.title', { credits: selectedPlanData.credits })}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {tPricing('modal.features.credits.description', { 
                        minutes: Math.floor(selectedPlanData.credits / 10) 
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Voix de haute qualité */}
              {selectedPlanData && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mic className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {tPricing('modal.features.high-quality-voices.title', { 
                        count: getVoiceCount(selectedPlanData.name) 
                      })}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {tPricing('modal.features.high-quality-voices.description')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton voir tous les avantages */}
            <div className="text-center mb-6 px-4 md:px-8">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={handleSeeAllPlans}
              >
                {tPricing('modal.see-all-benefits')}
              </Button>
            </div>
        </div>

        {/* Footer fixe avec bouton de paiement */}
        <div className="p-4 md:p-8 border-t md:border-t-0 bg-white">
          {selectedPlanData && (
            <Button 
              className="w-full h-12 md:h-14 text-sm md:text-base"
              size="lg"
              onClick={() => handlePayment(selectedPlanData, 'modal')}
              disabled={loadingPlan === selectedPlanData.name}
            >
              {tPricing('modal.upgrade-to', { plan: tPlan(selectedPlanData.name) })}
              {loadingPlan === selectedPlanData.name ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}