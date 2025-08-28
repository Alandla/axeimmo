import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { VideoFormat, VIDEO_FORMATS } from "@/src/types/video";
import { useTranslations } from "next-intl";

interface VideoFormatSelectorProps {
  value: VideoFormat;
  onValueChange: (format: VideoFormat) => void;
  disabled?: boolean;
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
    default:
      return null;
  }
};

export default function VideoFormatSelector({
  value,
  onValueChange,
  disabled = false,
}: VideoFormatSelectorProps) {
  const t = useTranslations("edit.video-format");

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sélectionner format...">
          <div className="flex items-center gap-2">
            {getFormatIcon(value)}
            <span>{t(value)}</span>
            <span className="text-muted-foreground text-xs">
              {VIDEO_FORMATS.find(f => f.value === value)?.ratio}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {VIDEO_FORMATS.map((format) => (
          <SelectItem key={format.value} value={format.value}>
            <div className="flex items-center gap-2">
              {getFormatIcon(format.value)}
              <span>{t(format.value)}</span>
              <span className="text-muted-foreground text-xs">
                {format.ratio}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 