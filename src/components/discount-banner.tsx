'use client'

import React, { useState, useEffect } from 'react'
import { Card } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { useTranslations } from 'next-intl'

export default function DiscountBanner() {
  const t = useTranslations('pricing.discount')
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  function calculateTimeLeft() {
    const difference = +new Date("2025-03-30") - +new Date()
    let timeLeft: { [key: string]: number } = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      }
    }

    return timeLeft
  }

  return (
    <Card className="bg-gradient-to-r from-[#CDF546]/60 to-[#CDF546]/60 text-gray-800 p-4 xl:px-48 shadow-lg mx-auto mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Badge className="text-4xl font-bold bg-white text-[#CDF546] p-3 rounded-full px-6">-20%</Badge>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-[#732039]">{t('title')}</h3>
            <p className="text-sm opacity-75 text-[#732039]">{t('description')}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-lg p-4 flex items-center">
            {Object.entries(timeLeft).map(([key, value], index) => (
              <React.Fragment key={key}>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-[#732039]">{value.toString().padStart(2, '0')}</span>
                  <span className="text-xs uppercase text-[#732039]">{t(key)}</span>
                </div>
                {index < Object.entries(timeLeft).length - 1 && (
                  <span className="text-2xl font-bold mx-4">:</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}