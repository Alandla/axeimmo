'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface PlanPeriodToggleProps {
  isAnnual: boolean
  onToggle: (isAnnual: boolean) => void
  fullWidth?: boolean
  equalWidth?: boolean
  compact?: boolean
}

export default function PlanPeriodToggle({ 
  isAnnual, 
  onToggle,
  fullWidth = false,
  equalWidth = true,
  compact = false
}: PlanPeriodToggleProps) {
  const tPricing = useTranslations('pricing')
  const [sliderWidth, setSliderWidth] = useState(0)
  const [sliderLeft, setSliderLeft] = useState(0)
  
  const monthlyRef = useRef<HTMLButtonElement>(null)
  const annuallyRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Mettre à jour la position et la largeur du fond en fonction de l'option sélectionnée
    if (isAnnual && annuallyRef.current) {
      setSliderWidth(annuallyRef.current.offsetWidth)
      setSliderLeft(annuallyRef.current.offsetLeft)
    } else if (!isAnnual && monthlyRef.current) {
      setSliderWidth(monthlyRef.current.offsetWidth)
      setSliderLeft(monthlyRef.current.offsetLeft)
    }
  }, [isAnnual])

  return (
    <div 
      ref={containerRef}
      className={`inline-flex items-center rounded-lg border p-0.5 relative ${fullWidth ? 'w-full' : ''}`}
    >
      <div 
        className="absolute top-0.5 bottom-0.5 rounded-lg bg-primary transition-all duration-300 ease-in-out"
        style={{ 
          width: `${sliderWidth - 4}px`, 
          left: `${sliderLeft + 2}px` 
        }}
      />
      <button
        ref={monthlyRef}
        onClick={() => onToggle(false)}
        className={`${equalWidth ? 'flex-1' : ''} ${compact ? 'px-3' : 'px-4'} py-2 rounded-lg text-sm relative z-10 transition-colors duration-300 ${
          !isAnnual ? 'text-primary-foreground' : ''
        }`}
      >
        {tPricing('monthly')}
      </button>
      <button
        ref={annuallyRef}
        onClick={() => onToggle(true)}
        className={`${equalWidth ? 'flex-1' : ''} ${compact ? 'px-3' : 'px-4'} py-2 rounded-lg text-sm relative z-10 transition-colors duration-300 flex items-center justify-center ${
          isAnnual ? 'text-primary-foreground' : ''
        }`}
      >
        <span>{tPricing('annually')}</span>
        <span className={`ml-1 text-xs ${compact ? 'px-1.5' : 'px-2'} py-0.5 rounded-full bg-[#FB5688]/10 text-[#FB5688] whitespace-nowrap`}>
          {tPricing('20-off')}
        </span>
      </button>
    </div>
  )
} 