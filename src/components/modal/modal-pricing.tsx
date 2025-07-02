'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
} from "@/src/components/ui/dialog"
import { Button } from '@/src/components/ui/button'
import { useTranslations } from 'next-intl'
import { PlanName } from '../../types/enums'
import PlanPeriodToggle from '../plan-period-toggle'
import { ArrowRight, Check, Sparkles, Layers, Video, X, Clock, Star, Heart, Gem, Link } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { usePricing } from '../../hooks/use-pricing'
import { SlidingNumber } from '../ui/sliding-number'

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
    urlToVideo: true
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

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <DialogContent 
        className="max-w-2xl p-0 gap-0 border-0 bg-white rounded-xl overflow-hidden" 
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >

        {/* Contenu principal */}
        <div className="p-4 pt-8 md:p-8 md:pt-12">
          {/* Titre centré avec avatars */}
          <div className="text-center mb-4 md:mb-6">
            <div className="flex justify-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-white"></div>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              {title || tPricing('modal.title')}
            </h2>
            <p className="text-gray-600 text-xs md:text-sm">
              {description || tPricing('modal.description')}
            </p>
          </div>

          {/* Period Toggle et Currency */}
          <div className="mb-8 flex justify-between items-center">
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

          {/* Plans en row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {plans.map((plan) => {
              const planDiscountedPrice = getPlanPrice(plan);
              const isSelected = plan.name === selectedPlan;
              
              return (
                <div 
                  key={plan.name}
                  className={`relative p-2 md:p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-gray-50 scale-105 shadow' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                        {tPricing('popular')}
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {plan.icon === "Star" && <Star className="h-4 w-4 text-[#FB5688]" />}
                      {plan.icon === "Heart" && <Heart className="h-4 w-4 text-[#FB5688]" />}
                      {plan.icon === "Gem" && <Gem className="h-4 w-4 text-[#FB5688]" />}
                      <h3 className="font-semibold text-lg text-gray-900">
                        {tPlan(plan.name)}
                      </h3>
                    </div>
                    <div className="items-center justify-center gap-1 mt-1 hidden sm:flex">
                      <div className="bg-green-100 px-2 py-1 rounded-lg">
                        <span className="text-sm font-bold text-green-700">{plan.credits}</span>
                        <span className="text-sm text-gray-600 ml-1">crédits/mois</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Grid avec bénéfices et prix */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* Section bénéfices */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 md:mb-4 text-sm md:text-base">
                  {tPricing('modal.what-you-get')}
                </h3>
                {/* Mobile: 2 colonnes, Desktop: 1 colonne */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                  {features.videoExports && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Video className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-xs md:text-base">{tPricing('modal.video-exports')}</span>
                    </div>
                  )}
                  {features.watermarkRemoval && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Layers className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-xs md:text-base">{tPricing('modal.watermark-removal')}</span>
                    </div>
                  )}
                  {features.videoMinutes && selectedPlanData && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Clock className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-xs md:text-base">
                        <span className="font-semibold">
                          <SlidingNumber value={Math.floor(selectedPlanData.credits / 10)} />
                        </span> minutes de vidéo
                      </span>
                    </div>
                  )}
                  {features.urlToVideo && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Link className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-xs md:text-base">{tPricing('modal.url-to-video')}</span>
                    </div>
                  )}
                  {features.credits && selectedPlanData && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-xs md:text-base">
                        <span className="font-semibold">
                          <SlidingNumber value={selectedPlanData.credits} />
                        </span> {tPricing('credits')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section prix */}
              <div className="flex flex-col justify-center">
                <div className="relative text-center p-3 md:p-6 bg-white rounded-xl shadow-sm h-[80px] md:h-[140px] flex flex-col justify-center">
                  {/* Badge de réduction en position absolue */}
                  {savePercentage > 0 && (
                    <div className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs md:text-sm px-2 py-1 rounded-full font-medium">
                      -{savePercentage}%
                    </div>
                  )}
                  
                  {/* Prix principal */}
                  <div className="flex items-end justify-center gap-1 md:gap-2">
                    <span className="text-3xl md:text-5xl font-bold text-gray-900">
                      <SlidingNumber value={Math.floor(discountedPrice)} />
                      {getCurrencySymbol()}
                    </span>
                    <div className="flex flex-col items-start text-xs md:text-sm -space-y-1 pb-1 md:pb-2">
                      {/* Prix barré uniquement si annuel */}
                      <span className={`line-through text-sm md:text-base text-gray-500 ${!isAnnual || savePercentage === 0 ? 'invisible' : ''}`}>
                        {selectedPlanData?.monthlyPrice}{getCurrencySymbol()}
                      </span>
                      <span className="text-gray-600">/{tPricing('month')}</span>
                    </div>
                  </div>
                  
                  {/* Facturé annuellement - toujours présent mais invisible si mensuel */}
                  <p className={`text-xs md:text-xs text-gray-500 ${!isAnnual ? 'invisible' : ''}`}>
                    {tPricing('billed-annually')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full h-12 md:h-14 text-sm md:text-base"
              onClick={handleSeeAllPlans}
            >
              {tPricing('modal.see-all-plans')}
            </Button>
            
            {selectedPlanData && (
              <Button 
                className="w-full h-12 md:h-14 text-sm md:text-base"
                size="lg"
                onClick={() => handlePayment(selectedPlanData, 'modal')}
                disabled={loadingPlan === selectedPlanData.name}
              >
                {loadingPlan === selectedPlanData.name ? (
                  <>
                    {tPricing('loading')}
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    {tPricing('modal.upgrade-to', { plan: tPlan(selectedPlanData.name) })}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}