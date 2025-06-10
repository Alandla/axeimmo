import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Label } from '@/src/components/ui/label'

const cameraMovements = [
  { value: 'Static', label: 'Static' },
  { value: 'Horizontal', label: 'Horizontal' },
  { value: 'Vertical', label: 'Vertical' },
  { value: 'Zoom', label: 'Zoom' },
  { value: 'Pan', label: 'Pan' },
  { value: 'Tilt', label: 'Tilt' },
  { value: 'Roll', label: 'Roll' },
  { value: 'Master Shot: Move Left and Zoom In', label: 'Master Shot: Move Left and Zoom In' },
  { value: 'Master Shot: Move Right and Zoom In', label: 'Master Shot: Move Right and Zoom In' },
  { value: 'Master Shot: Move Forward and Zoom Up', label: 'Master Shot: Move Forward and Zoom Up' },
  { value: 'Master Shot: Move Down and Zoom Out', label: 'Master Shot: Move Down and Zoom Out' }
]

interface CameraMovementSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function CameraMovementSelect({ value, onChange, className }: CameraMovementSelectProps) {
  const t = useTranslations('assets')

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label htmlFor="camera-movement" className="text-sm font-medium">
        {t('camera-movement-label')}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('camera-movement-placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {cameraMovements.map((movement) => (
            <SelectItem key={movement.value} value={movement.value}>
              {movement.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 