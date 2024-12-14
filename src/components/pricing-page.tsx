'use client'

import { useState } from 'react'
import { Star, Heart, Diamond, Check, Gem, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { useTranslations } from 'next-intl'
import { PlanName } from '../types/enums'
import { plans } from '../config/plan.config'

export default function PricingPage() {
  const tPlan = useTranslations('plan')
  const [isAnnual, setIsAnnual] = useState(false)
  
  const calculateDiscount = (monthly: number, annual: number) => {
    const discount = ((monthly - annual) / monthly) * 100
    return Math.round(discount)
  }

  return (
    <div className="container mx-auto px-4 py-16 sm:max-w-7xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center rounded-full border p-1 mb-8">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-full text-sm ${
              !isAnnual ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-full text-sm ${
              isAnnual ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            Annually
            <span className="ml-1 text-xs bg-[#FB5688]/10 text-[#FB5688] px-2 py-0.5 rounded-full">
              15% off
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mb-8">
        {plans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
          const discount = calculateDiscount(plan.monthlyPrice, plan.annualPrice)
          
          return (
            <Card 
              key={plan.name}
              className={`relative ${
                plan.popular ? 'bg-black text-white' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-[#FB5688] text-white text-xs rounded-full">
                  Popular
                </div>
              )}
              {isAnnual && (
                <div className={`absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full ${
                  plan.popular 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
                }`}>
                  Save {calculateDiscount(plan.monthlyPrice, plan.annualPrice)}%
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
                  <span className="text-4xl font-bold">{price}€</span>
                  <div className="flex flex-col text-sm">
                    <span className={`line-through ${isAnnual ? '' : 'opacity-0'}`}>{plan.monthlyPrice}€</span>
                    <span className="text-sm text-muted-foreground">/month{isAnnual && ', billed annually'}</span>
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
                >
                  Upgrade to {tPlan(plan.name)}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">{feature}</span>
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
            <CardTitle>Custom</CardTitle>
            <p className="text-sm text-muted-foreground">
              Need a custom plan? Contact us for a tailored solution.
            </p>
          </div>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Contact Sales
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

