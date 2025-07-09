import { useTranslations } from "next-intl"
import { LogoPosition } from "@/src/types/space"
import React, { useRef, useLayoutEffect, useState } from "react"

interface LogoPositionSelectorProps {
  value: LogoPosition
  onChange: (position: LogoPosition) => void
}

export function LogoPositionSelector({ value, onChange }: LogoPositionSelectorProps) {
  const t = useTranslations('settings.brand-kit')
  const PADDING = 12
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 120, height: 213.33 }) // 9/16 ratio

  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }
  }, [])

  useLayoutEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Convertit un pourcentage (0-100) en px dans la zone totale
  function percentToPx(percent: number, size: number) {
    return (size * percent) / 100
  }

  // Convertit une position en px dans la zone totale en pourcentage (0-100)
  function pxToPercent(px: number, size: number) {
    return (px / size) * 100
  }

  const predefinedPositions: { key: string; label: string; position: LogoPosition }[] = [
    { key: 'top-left', label: t('position.top-left'), position: { x: 15, y: 10 } },
    { key: 'top-right', label: t('position.top-right'), position: { x: 85, y: 10 } },
    { key: 'middle-left', label: t('position.middle-left'), position: { x: 15, y: 50 } },
    { key: 'middle-right', label: t('position.middle-right'), position: { x: 85, y: 50 } },
    { key: 'bottom-left', label: t('position.bottom-left'), position: { x: 15, y: 90 } },
    { key: 'bottom-right', label: t('position.bottom-right'), position: { x: 85, y: 90 } },
  ]

  const handlePositionClick = (x: number, y: number) => {
    onChange({ x, y })
  }

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const xPx = e.clientX - rect.left
    const yPx = e.clientY - rect.top
    // Limiter les positions pour éviter que le logo soit trop près des bords
    const x = Math.max(10, Math.min(90, pxToPercent(xPx, rect.width)))
    const y = Math.max(10, Math.min(90, pxToPercent(yPx, rect.height)))
    onChange({ x, y })
  }

  return (
    <div className="relative">
      <div className="w-full max-w-[120px] mx-auto">
        <div
          ref={containerRef}
          className="relative aspect-[9/16] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 cursor-crosshair"
          style={{ minHeight: 200, boxSizing: 'border-box' }}
          onMouseDown={handleDrag}
        >
          {/* Points prédéfinis */}
          {predefinedPositions.map(({ key, position }) => (
            <button
              key={key}
              onClick={e => {
                e.stopPropagation()
                handlePositionClick(position.x, position.y)
              }}
              className="absolute z-10 rounded-md border border-gray-300 bg-white hover:border-black transition-all duration-100"
              style={{
                width: 24,
                height: 24,
                left: percentToPx(position.x, dimensions.width),
                top: percentToPx(position.y, dimensions.height),
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={key}
            >
              <span className="w-1 h-1 rounded-full bg-gray-700" />
            </button>
          ))}

          {/* Point central de référence */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: percentToPx(50, dimensions.width),
              top: percentToPx(50, dimensions.height),
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="w-2 h-2 rounded-md bg-gray-200" />
          </div>

          {/* Position actuelle */}
          <div
            className="absolute z-20 rounded-md border border-black bg-black transition-all duration-300"
            style={{
              width: 24,
              height: 24,
              left: percentToPx(value.x, dimensions.width),
              top: percentToPx(value.y, dimensions.height),
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-gray-500">
            {t('position.custom')} ({Math.round(value.x)}%, {Math.round(value.y)}%)
          </p>
        </div>
      </div>
    </div>
  )
} 