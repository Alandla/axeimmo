'use client'

import { useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { Button } from '@/src/components/ui/button'
import { PlanName } from '@/src/types/enums'
import { plans } from '@/src/config/plan.config'
import { basicApiCall } from '@/src/lib/api'
import { Loader2, ArrowRight, Check, Lock } from 'lucide-react'
import { track } from '@/src/utils/mixpanel'
import { MixpanelEvent } from '@/src/types/events'
import { getCookie } from '@/src/lib/cookies'
import { motion } from 'framer-motion'
import PlanPeriodToggle from './plan-period-toggle'

function VideoPlayer() {
  const locale = useLocale()
  const videoSrc = locale === 'fr' 
    ? 'https://assets.hoox.video/demo-auto-media-placement-fr.mp4'
    : 'https://assets.hoox.video/demo-auto-media-placement-en.mp4'
  
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    
    setIsPlaying(!isPlaying)
  }
  
  const handleVideoStateChange = () => {
    if (!videoRef.current) return
    setIsPlaying(!videoRef.current.paused)
  }
    
  return (
    <div className="aspect-video rounded-md overflow-hidden shadow-lg w-full max-w-3xl relative">
      <video 
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        src={videoSrc}
        onClick={togglePlay}
        onPlay={handleVideoStateChange}
        onPause={handleVideoStateChange}
      />
      
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
            <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-black border-b-[14px] border-b-transparent ml-2" />
          </div>
        </div>
      )}
    </div>
  )
}

function PricingCard({ 
  isAnnual, 
  setIsAnnual, 
  onUpgradeClick,
  isLoading,
  currentPrice,
  currency,
  setCurrency,
  monthlyPrice
}: { 
  isAnnual: boolean, 
  setIsAnnual: (value: boolean) => void,
  onUpgradeClick: () => void,
  isLoading: boolean,
  currentPrice: number,
  currency: string,
  setCurrency: (currency: string) => void,
  monthlyPrice: number
}) {
  const t = useTranslations('assets')
  const tPricing = useTranslations('pricing')
  const tPlan = useTranslations('plan')
  
  const features = [
    "feature.smart-media-placement",
    "feature.save-templates",
    "feature.brand-kit",
    "feature.ai-video-b-rolls",
    "feature.social-media-agent"
  ]
  
  const getCurrencySymbol = () => {
    return currency === "EUR" ? "€" : "$"
  }
  
  const savePercentage = isAnnual ? Math.round(((monthlyPrice - currentPrice) / monthlyPrice) * 100) : 0
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
      <div className="flex items-center justify-between">
        <PlanPeriodToggle isAnnual={isAnnual} onToggle={setIsAnnual} compact={true} />
        
        <div className="flex items-center gap-1 border rounded-md h-[42px]">
          <button 
            className={`px-2 h-full rounded-l-md ${currency === "USD" ? 'bg-primary text-black' : 'hover:bg-gray-100'}`}
            onClick={() => setCurrency("USD")}
          >
            $
          </button>
          <button 
            className={`px-2 h-full rounded-r-md ${currency === "EUR" ? 'bg-primary text-black' : 'hover:bg-gray-100'}`}
            onClick={() => setCurrency("EUR")}
          >
            €
          </button>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mt-4">{t('upgrade-banner.upgrade-to')} {tPlan(PlanName.PRO)}</h3>
      <p className="text-gray-500">{t('upgrade-banner.pro-description')}</p>
      
      <div className="mt-4 flex gap-2">
        <span className="text-4xl font-bold text-gray-900">{currentPrice}{getCurrencySymbol()}</span>
        <div className="flex flex-col text-sm -space-y-1">
          <span className={`line-through ${savePercentage > 0 ? '' : 'opacity-0'}`}>{monthlyPrice}{getCurrencySymbol()}</span>
          <span className="text-gray-500">/{tPricing('month')}{isAnnual && `, ${tPricing('billed-annually')}`}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-1">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <Check size={18} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{tPricing(feature)}</span>
          </div>
        ))}
      </div>
      
      <Button 
        className="w-full mt-4 h-12 font-medium"
        size="lg"
        onClick={onUpgradeClick}
        disabled={isLoading}
      >
        {t('upgrade-banner.upgrade-now')}
        {isLoading ? (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

export default function AssetUpgradeBanner() {
  const t = useTranslations('assets')
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [currency, setCurrency] = useState("EUR")
  const { activeSpace } = useActiveSpaceStore()

  const proPlan = plans.find(plan => plan.name === PlanName.PRO)
  
  const basePrice = isAnnual && proPlan ? proPlan.annualPrice : proPlan ? proPlan.monthlyPrice : 0
  const monthlyPrice = proPlan ? proPlan.monthlyPrice : 0

  const handleUpgrade = async () => {
    if (!proPlan || !activeSpace) return
    
    try {
      setLoadingPlan(true)
      
      track(MixpanelEvent.GO_TO_CHECKOUT, {
        plan: proPlan.name,
        subscriptionType: isAnnual ? 'annual' : 'monthly',
        price: isAnnual ? proPlan.annualPrice : proPlan.monthlyPrice,
        currency: currency,
        context: 'assets_page'
      })

      const priceId = isAnnual ? proPlan.priceId.annual : proPlan.priceId.month
      const price = currency === "EUR" ? priceId.euros : priceId.dollars
      
      const toltReferral = typeof window !== 'undefined' && (window as any).tolt_referral ? (window as any).tolt_referral : undefined
      const fbc = getCookie("_fbc") || undefined
      const fbp = getCookie("_fbp") || undefined
      
      const url: string = await basicApiCall('/stripe/createCheckout', {
        priceId: price,
        spaceId: activeSpace.id,
        mode: 'subscription',
        successUrl: window.location.href,
        cancelUrl: window.location.href,
        toltReferral: toltReferral,
        price: isAnnual ? proPlan.annualPrice : proPlan.monthlyPrice,
        currency: currency,
        fbc: fbc,
        fbp: fbp,
      })

      window.location.href = url
    } catch (error) {
      console.error('Erreur lors du checkout:', error)
      setLoadingPlan(false)
    }
  }

  return (
    <motion.div 
      className="bg-gray-50 rounded-xl p-8 px-4 sm:px-8 shadow-sm border"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="font-bold h-6 w-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('upgrade-banner.title')}
            </h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-base">
            {t('upgrade-banner.description')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-center items-center gap-4">
          <div className="w-full lg:w-3/5 flex justify-center">
            <VideoPlayer />
          </div>
          
          <div className="w-full lg:w-2/5">
            <PricingCard 
              isAnnual={isAnnual} 
              setIsAnnual={setIsAnnual} 
              onUpgradeClick={handleUpgrade}
              isLoading={loadingPlan}
              currentPrice={basePrice}
              currency={currency}
              setCurrency={setCurrency}
              monthlyPrice={monthlyPrice}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
} 