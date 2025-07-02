'use client'

import { useState, useEffect } from 'react'
import { PlanName } from '../types/enums'
import { discount, plans } from '../config/plan.config'
import { Plan } from '../types/plan'
import { basicApiCall, basicApiGetCall } from '../lib/api'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { track } from '@/src/utils/mixpanel'
import { MixpanelEvent } from '@/src/types/events'
import { getCookie } from '../lib/cookies'

export function usePricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { activeSpace } = useActiveSpaceStore()
  const [currency, setCurrency] = useState("USD")
  
  useEffect(() => {
    async function detectUserCurrency() {
      try {
        const { recommendedCurrency } = await basicApiGetCall<{ recommendedCurrency: string }>('/geolocation');
        if (recommendedCurrency) {
          setCurrency(recommendedCurrency);
        }
      } catch (error) {
        console.error("Error detecting user currency:", error);
      }
    }
    
    detectUserCurrency();
  }, []);

  const getCurrencySymbol = () => {
    return currency === "EUR" ? "€" : "$";
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

  const handlePayment = async (plan: Plan, context?: string) => {
    try {
      setLoadingPlan(plan.name);

      const priceValue = isAnnual ? plan.annualPrice : plan.monthlyPrice;
      const discountedPrice = applyDiscount(priceValue);

      track(MixpanelEvent.GO_TO_CHECKOUT, {
        plan: plan.name,
        subscriptionType: isAnnual ? 'annual' : 'monthly',
        price: discountedPrice,
        currency: currency,
        context: context || 'pricing'
      });

      if (activeSpace?.planName === PlanName.FREE) {
        const priceId = isAnnual ? plan.priceId.annual : plan.priceId.month;

        const price = currency === "EUR" ? priceId.euros : priceId.dollars;
        
        const toltReferral = typeof window !== 'undefined' && (window as any).tolt_referral ? (window as any).tolt_referral : undefined;
        const fbc = getCookie("_fbc") || undefined;
        const fbp = getCookie("_fbp") || undefined;
        
        const url: string = await basicApiCall('/stripe/createCheckout', {
          priceId: price,
          spaceId: activeSpace?.id,
          mode: 'subscription',
          couponId: discount.active ? discount.couponId : undefined,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
          toltReferral: toltReferral,
          price: discountedPrice,
          currency: currency,
          fbc: fbc,
          fbp: fbp,
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
      console.error('Erreur lors du checkout:', error);
      setLoadingPlan(null);
    }
  }

  const getButtonProps = (planName: PlanName, tPricing: any) => {
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

  const getPlanPrice = (plan: Plan) => {
    const basePrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return applyDiscount(basePrice);
  }

  const getSavePercentage = (plan: Plan) => {
    const promoSavePercentage = discount.active ? Math.round((1 - discount.reduction) * 100) : 0;
    const annualSavePercentage = calculateAnnualDiscount(plan.monthlyPrice, plan.annualPrice);
    
    return discount.active ? promoSavePercentage : (isAnnual ? annualSavePercentage : 0);
  }

  return {
    isAnnual,
    setIsAnnual,
    loadingPlan,
    setLoadingPlan,
    currency,
    setCurrency,
    getCurrencySymbol,
    applyDiscount,
    calculateAnnualDiscount,
    handlePayment,
    getButtonProps,
    getPlanPrice,
    getSavePercentage,
    plans,
    discount
  }
} 