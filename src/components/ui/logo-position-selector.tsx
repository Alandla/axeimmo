import { useTranslations } from "next-intl"
import { LogoPosition } from "@/src/types/space"
import React, { useRef, useLayoutEffect, useState } from "react"

interface LogoPositionSelectorProps {
  value: LogoPosition
  onChange: (position: LogoPosition) => void
  hideBottomPositions?: boolean
  predefinedOnly?: boolean
  isSquare?: boolean
}

export function LogoPositionSelector({ value, onChange, hideBottomPositions = false, predefinedOnly = false, isSquare = false }: LogoPositionSelectorProps) {
  const t = useTranslations('settings.brand-kit')
  const PADDING = 12
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 120, height: isSquare ? 120 : 213.33 }) // 1/1 or 9/16 ratio

  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }
  }, [isSquare])

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

  // Pour le format carré, ajuste les positions pour éviter les bords
  const getAdjustedPosition = (position: { x: number, y: number }) => {
    if (!isSquare) return position
    
    // Ajoute un padding de 10% en haut et en bas pour le format carré
    const paddingY = 10
    const adjustedY = paddingY + (position.y * (100 - 2 * paddingY)) / 100
    
    return { x: position.x, y: adjustedY }
  }

  const predefinedPositions: { key: string; label: string; position: LogoPosition }[] = [
    { key: 'top-left', label: t('position.top-left'), position: { x: 15, y: 10 } },
    { key: 'top-right', label: t('position.top-right'), position: { x: 85, y: 10 } },
    { key: 'middle-left', label: t('position.middle-left'), position: { x: 15, y: 50 } },
    { key: 'middle-right', label: t('position.middle-right'), position: { x: 85, y: 50 } },
    ...(hideBottomPositions ? [] : [
      { key: 'bottom-left', label: t('position.bottom-left'), position: { x: 15, y: 90 } },
      { key: 'bottom-right', label: t('position.bottom-right'), position: { x: 85, y: 90 } },
    ]),
  ]

  const handlePositionClick = (x: number, y: number) => {
    onChange({ x, y })
  }

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || predefinedOnly) return
    const rect = containerRef.current.getBoundingClientRect()
    const xPx = e.clientX - rect.left
    const yPx = e.clientY - rect.top
    
    let x = pxToPercent(xPx, rect.width)
    let y = pxToPercent(yPx, rect.height)
    
    if (isSquare) {
      // Pour le format carré, ajuste les limites pour éviter les bords
      const paddingY = 10
      const minY = paddingY
      const maxY = 100 - paddingY
      y = Math.max(minY, Math.min(maxY, y))
    } else {
      // Limites normales pour le format portrait
      x = Math.max(10, Math.min(90, x))
      y = Math.max(10, Math.min(90, y))
    }
    
    onChange({ x, y })
  }

  // Trouve le nom de la position actuelle
  const getCurrentPositionName = () => {
    const tolerance = 5 // Tolérance de 5% pour considérer qu'une position correspond
    const matchingPosition = predefinedPositions.find(pos => 
      Math.abs(pos.position.x - value.x) <= tolerance && 
      Math.abs(pos.position.y - value.y) <= tolerance
    )
    return matchingPosition ? matchingPosition.label : t('position.custom')
  }

  return (
    <div className="relative">
      <div className="w-full max-w-[120px] mx-auto">
        <div
          ref={containerRef}
          className={`relative ${isSquare ? 'aspect-square' : 'aspect-[9/16]'} bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 ${predefinedOnly ? '' : 'cursor-crosshair'}`}
          style={{ minHeight: isSquare ? 120 : 200, minWidth: 120, boxSizing: 'border-box' }}
          onMouseDown={handleDrag}
        >
          {/* Points prédéfinis */}
          {predefinedPositions.map(({ key, position }) => {
            const adjustedPosition = getAdjustedPosition(position)
            return (
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
                  left: percentToPx(adjustedPosition.x, dimensions.width),
                  top: percentToPx(adjustedPosition.y, dimensions.height),
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={key}
              >
                <span className="w-1 h-1 rounded-full bg-gray-700" />
              </button>
            )
          })}

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
              left: percentToPx(getAdjustedPosition(value).x, dimensions.width),
              top: percentToPx(getAdjustedPosition(value).y, dimensions.height),
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
          <p className="text-xs font-medium text-gray-500 w-full min-w-[120px]">
            {getCurrentPositionName()}
          </p>
        </div>
      </div>
    </div>
  )
} 