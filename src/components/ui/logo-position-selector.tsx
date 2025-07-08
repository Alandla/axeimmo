import { useTranslations } from "next-intl"

type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right'

interface LogoPositionSelectorProps {
  value: LogoPosition
  onChange: (position: LogoPosition) => void
}

export function LogoPositionSelector({ value, onChange }: LogoPositionSelectorProps) {
  const t = useTranslations('settings.brand-kit')

  const positions: { key: LogoPosition; label: string; className: string }[] = [
    { key: 'top-left', label: t('position.top-left'), className: 'col-start-1 row-start-1' },
    { key: 'top-right', label: t('position.top-right'), className: 'col-start-3 row-start-1' },
    { key: 'middle-left', label: t('position.middle-left'), className: 'col-start-1 row-start-2' },
    { key: 'middle-right', label: t('position.middle-right'), className: 'col-start-3 row-start-2' },
    { key: 'bottom-left', label: t('position.bottom-left'), className: 'col-start-1 row-start-3' },
    { key: 'bottom-right', label: t('position.bottom-right'), className: 'col-start-3 row-start-3' },
  ]

  return (
    <div className="relative">
      <div className="w-full max-w-[120px] mx-auto">
        <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200" style={{ minHeight: 200, padding: 0 }}>
          {(() => {
            const PAD = 12
            const SIZE = 24
            const leftPct = `${(PAD / (120 - SIZE)) * 100}%`
            const rightPct = `${100 - (PAD / (120 - SIZE)) * 100}%`
            const topPct = `${(PAD / (200 - SIZE)) * 100}%`
            const bottomPct = `${100 - (PAD / (200 - SIZE)) * 100}%`
            const coords = {
              'top-left':      { left: leftPct,   top: topPct },
              'top-right':     { left: rightPct,  top: topPct },
              'bottom-left':   { left: leftPct,   top: bottomPct },
              'bottom-right':  { left: rightPct,  top: bottomPct },
              'middle-left':   { left: leftPct,   top: '50%' },
              'middle-right':  { left: rightPct,  top: '50%' },
            }
            const offset = 'translate(-50%, -50%)'
            const selected = coords[value]
            return (
              <>
                {Object.entries(coords).map(([key, pos]) => (
                  <button
                    key={key}
                    onClick={() => onChange(key as LogoPosition)}
                    className="absolute z-10 rounded-md border border-gray-300 bg-white hover:border-black transition-all duration-100"
                    style={{
                      width: SIZE,
                      height: SIZE,
                      left: pos.left,
                      top: pos.top,
                      transform: offset,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={positions.find(p => p.key === key)?.label}
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                  </button>
                ))}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-md bg-gray-200" />
                </div>
                <div
                  className="absolute z-20 rounded-md border border-black bg-black transition-all duration-300"
                  style={{
                    width: SIZE,
                    height: SIZE,
                    left: selected.left,
                    top: selected.top,
                    transform: offset,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
              </>
            )
          })()}
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-gray-500">
            {positions.find(p => p.key === value)?.label}
          </p>
        </div>
      </div>
    </div>
  )
} 