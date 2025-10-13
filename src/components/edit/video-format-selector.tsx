import { Check, Lock } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { VideoFormat, VIDEO_FORMATS } from "@/src/types/video";
import { useTranslations } from "next-intl";
import { Badge } from "../ui/badge";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { PlanName } from "@/src/types/enums";
import ModalPricing from "../modal/modal-pricing";

interface VideoFormatSelectorProps {
  value: VideoFormat;
  onValueChange: (format: VideoFormat) => void;
  width?: number;
  height?: number;
  onWidthChange?: (width: number) => void;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
  light?: boolean;
}

// Fonction pour obtenir l'icône correspondant au format
const getFormatIcon = (format: VideoFormat) => {
  switch (format) {
    case 'vertical':
      return (
        <div className="h-4 w-2.5 border border-current rounded-sm flex-shrink-0" />
      );
    case 'ads':
      return (
        <div className="h-3.5 w-2.5 border border-current rounded-sm flex-shrink-0" />
      );
    case 'square':
      return (
        <div className="h-3.5 w-3.5 border border-current rounded-sm flex-shrink-0" />
      );
    case 'horizontal':
      return (
        <div className="h-2.5 w-4 border border-current rounded-sm flex-shrink-0" />
      );
    case 'custom':
      return (
        <div className="h-3.5 w-3 border border-current border-dashed rounded-sm flex-shrink-0" />
      );
    default:
      return null;
  }
};

export default function VideoFormatSelector({
  value,
  onValueChange,
  width,
  height,
  onWidthChange,
  onHeightChange,
  disabled = false,
  light = false,
}: VideoFormatSelectorProps) {
  const t = useTranslations("edit.video-format");
  const planT = useTranslations('plan');
  const { activeSpace } = useActiveSpaceStore();
  const [open, setOpen] = useState(false);
  const [isInteractingWithInputs, setIsInteractingWithInputs] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const isCustomFormatAvailable = () => {
    if (!activeSpace) return false;
    return activeSpace.planName === PlanName.ENTREPRISE;
  };

  const handleValueChange = (newValue: VideoFormat) => {
    // Vérifier si c'est le format custom et si l'utilisateur a accès
    if (newValue === 'custom' && !isCustomFormatAvailable()) {
      setIsPricingModalOpen(true);
      return;
    }

    // Si on passe à custom, initialiser avec les dimensions du format actuel
    if (newValue === 'custom' && value !== 'custom') {
      const currentDimensions = VIDEO_FORMATS.find(f => f.value === value);
      if (currentDimensions && onWidthChange && onHeightChange) {
        onWidthChange(currentDimensions.width);
        onHeightChange(currentDimensions.height);
      }
    }
    
    onValueChange(newValue);
    if (newValue !== 'custom') {
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Ne pas fermer si on est en train d'interagir avec les inputs
    if (!newOpen && isInteractingWithInputs) {
      return;
    }
    setOpen(newOpen);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.min(5000, Math.max(0, parseInt(e.target.value) || 0));
    onWidthChange?.(newWidth);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.min(5000, Math.max(0, parseInt(e.target.value) || 0));
    onHeightChange?.(newHeight);
  };

  return (
    <>
      <Select value={value} onValueChange={handleValueChange} disabled={disabled} open={open} onOpenChange={handleOpenChange}>
        <SelectTrigger variant={light ? "ghost" : "default"}>
          <SelectValue placeholder="Sélectionner format...">
            <div className="flex items-center gap-2">
              {getFormatIcon(value)}
              {light ? (
                <span className="text-sm">
                  {value === 'custom' ? `${width}x${height}` : VIDEO_FORMATS.find(f => f.value === value)?.ratio}
                </span>
              ) : (
                <>
                  <span>{t(value)}</span>
                  {value !== 'custom' && (
                    <span className="text-muted-foreground text-xs">
                      {VIDEO_FORMATS.find(f => f.value === value)?.ratio}
                    </span>
                  )}
                </>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {VIDEO_FORMATS.map((format) => {
            if (format.value === 'custom') {
              const hasAccess = isCustomFormatAvailable();
              return (
                <div key={format.value}>
                  <div 
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleValueChange('custom')}
                  >
                    <div className="flex items-center gap-2">
                      {getFormatIcon('custom')}
                      <span className={!hasAccess ? 'text-gray-400' : ''}>{t('custom')}</span>
                      {!hasAccess && (
                        <>
                          <Badge variant="plan">
                            {planT('ENTREPRISE')}
                          </Badge>
                        </>
                      )}
                    </div>
                    {value === 'custom' && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  {value === 'custom' && hasAccess && (
                    <div 
                      className="px-2 py-2 flex items-center justify-center gap-2"
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Input
                        type="number"
                        min="1"
                        max="5000"
                        value={width || 1080}
                        onChange={handleWidthChange}
                        className="h-7 text-sm w-18"
                        onFocus={() => setIsInteractingWithInputs(true)}
                        onBlur={() => setIsInteractingWithInputs(false)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                      <span className="text-muted-foreground text-sm">×</span>
                      <Input
                        type="number"
                        min="1"
                        max="5000"
                        value={height || 1920}
                        onChange={handleHeightChange}
                        className="h-7 text-sm w-18"
                        onFocus={() => setIsInteractingWithInputs(true)}
                        onBlur={() => setIsInteractingWithInputs(false)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <SelectItem key={format.value} value={format.value}>
                <div className="flex items-center gap-2">
                  {getFormatIcon(format.value)}
                  <span>{t(format.value)}</span>
                  <span className="text-muted-foreground text-xs">
                    {format.ratio}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <ModalPricing
        title={t('upgrade-modal.title')}
        description={t('upgrade-modal.description')}
        isOpen={isPricingModalOpen}
        setIsOpen={setIsPricingModalOpen}
        features={{
          credits: true,
          watermarkRemoval: false,
          videoMinutes: true,
          urlToVideo: true,
          videoExports: true
        }}
        recommendedPlan={PlanName.ENTREPRISE}
      />
    </>
  );
} 