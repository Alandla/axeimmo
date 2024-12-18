'use client'

import { useState } from 'react'
import { Star, Heart, Diamond, Check, Gem, ArrowRight, Info, Loader2, Phone, PhoneCall } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { useTranslations } from 'next-intl'
import { PlanName } from '../types/enums'
import { discount, plans } from '../config/plan.config'
import { Plan } from '../types/plan'
import { basicApiCall } from '../lib/api'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import Link from 'next/link'
import DiscountBanner from './discount-banner'

export default function PricingPage() {
  const tPlan = useTranslations('plan')
  const tPricing = useTranslations('pricing')
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { activeSpace } = useActiveSpaceStore()

  const handlePayment = async (plan: Plan) => {
    try {
      setLoadingPlan(plan.name);
      if (activeSpace?.planName === PlanName.FREE) {
        const priceId = isAnnual ? plan.priceId.annual : plan.priceId.month;
        const price = priceId.euros;
        
        const url: string = await basicApiCall('/stripe/createCheckout', {
          priceId: price,
          spaceId: activeSpace?.id,
          mode: 'subscription',
          couponId: discount.active ? discount.couponId : undefined,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        })

        window.location.href = url;
      } else {
        const stripePortalURL: string = await basicApiCall('/stripe/createPortal', {
          spaceId: activeSpace?.id,
          returnUrl: window.location.href,
        });
        if (stripePortalURL) {
          window.location.href = stripePortalURL;
        }
      }
      setLoadingPlan(null);
    } catch (error) {
      setLoadingPlan(null);
    }
  }

  const applyDiscount = (price: number) => {
    if (!discount.active) return price;
    if (discount.mode === "all" 
      || (discount.mode === "year" && isAnnual) 
      || (discount.mode === "month" && !isAnnual)) {
      return price * discount.reduction;
    }
    return price;
  };

  const calculateAnnualDiscount = (monthly: number, annual: number) => {
    return Math.round(((monthly - annual) / monthly) * 100);
  };

  const getButtonProps = (planName: PlanName) => {
    if (!activeSpace?.planName) return { text: tPricing('upgrade'), disabled: false }
    
    const currentPlanIndex = plans.findIndex(p => p.name === activeSpace.planName)
    const thisPlanIndex = plans.findIndex(p => p.name === planName)
    
    if (planName === activeSpace.planName) {
      return { text: tPricing('current-plan'), disabled: true }
    }
    
    return {
      text: thisPlanIndex > currentPlanIndex ? tPricing('upgrade') : tPricing('downgrade'),
      disabled: false
    }
  }

  return (
    <div className="container mx-auto px-4 sm:max-w-7xl">
      {discount.active && (
        <DiscountBanner />
      )}

      <div className="mb-8 text-center">
        <div className="inline-flex items-center rounded-full border p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-full text-sm ${
              !isAnnual ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            {tPricing('monthly')}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-full text-sm ${
              isAnnual ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            {tPricing('annually')}
            <span className="ml-1 text-xs bg-[#FB5688]/10 text-[#FB5688] px-2 py-0.5 rounded-full">
              {tPricing('20-off')}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mb-8">
        {plans.map((plan) => {
          const basePrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const discountedPrice = applyDiscount(basePrice);
          const buttonProps = getButtonProps(plan.name)
          
          const promoSavePercentage = discount.active ? Math.round((1 - discount.reduction) * 100) : 0;
          const annualSavePercentage = calculateAnnualDiscount(plan.monthlyPrice, plan.annualPrice);
          
          const savePercentage = discount.active ? promoSavePercentage : (isAnnual ? annualSavePercentage : 0);
          
          return (
            <Card 
              key={plan.name}
              className={`relative ${
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
                  <span className="text-4xl font-bold">{Math.floor(discountedPrice)}€</span>
                  <div className="flex flex-col text-sm">
                    <span className={`line-through ${savePercentage > 0 ? '' : 'opacity-0'}`}>{plan.monthlyPrice}€</span>
                    <span className="text-sm text-muted-foreground">/{tPricing('month')}{isAnnual && `, ${tPricing('billed-annually')}`}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className={`w-full mb-4 ${
                    plan.name === PlanName.CREATOR 
                      ? 'bg-white text-black border border-gray-300 hover:bg-gray-100' 
                      : plan.popular 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : ''
                  }`}
                  onClick={() => handlePayment(plan)}
                  disabled={loadingPlan === plan.name || buttonProps.disabled}
                >
                  {buttonProps.text}
                  {loadingPlan === plan.name ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
                <div className="border-t my-4" />
                <div className="mb-4">
                  <h3 className="font-medium mb-1">{tPricing('features')}</h3>
                  {plan.name !== PlanName.CREATOR ? (
                    <p className="text-sm text-muted-foreground">
                      {tPricing('everything-in')} {tPlan(plans[plans.findIndex(p => p.name === plan.name) - 1].name)}, {tPricing('plus')}:
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {tPricing('everything-in')} {tPlan(PlanName.FREE)}, {tPricing('plus')}:
                    </p>
                  )}
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-bold flex items-center gap-1">
                        {plan.credits} {tPricing('credits')}
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {plan.credits === 250 && tPricing('250-credits')}
                                {plan.credits === 1000 && tPricing('1000-credits')}
                                {plan.credits === 3000 && tPricing('3000-credits')}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                  </li>
                  {plan.features.map((feature, index) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">{tPricing(feature)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
              <PhoneCall className="w-4 h-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

