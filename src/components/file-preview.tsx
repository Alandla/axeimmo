import { File, Info, MicVocal, User, X, AudioLines } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

interface FilePreviewProps {
  file: File;
  usage: "voice" | "avatar" | "media";
  onUsageChange: (newUsage: "voice" | "avatar" | "media") => void;
  onRemove: () => void;
}

export function FilePreview({ file, usage, onUsageChange, onRemove }: FilePreviewProps) {
  const t = useTranslations("filePreview.tooltip");
  const [mediaUrl, setMediaUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const getAvailableTypes = () => {
    const fileType = file.type.split('/')[0];
    switch (fileType) {
      case 'audio':
        return ['voice'];
      case 'image':
        return ['media'];
      case 'video':
        return ['avatar', 'media'];
      default:
        return ['voice', 'avatar', 'media'];
    }
  };

  const availableTypes = getAvailableTypes();

  const renderPreview = () => {
    const fileType = file.type.split('/')[0];
    switch (fileType) {
      case 'audio':
        return <AudioLines className="w-8 h-8 text-gray-500" />;
      case 'image':
        return <img src={mediaUrl} alt={file.name} className="w-full h-full object-cover rounded" />;
      case 'video':
        return <video src={mediaUrl} className="w-full h-full object-cover rounded" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-2 border rounded-lg">
      <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {renderPreview()}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate mr-2">
            {file.name.length > 12 ? `${file.name.slice(0, 12)}...` : file.name}
          </p>
          <button onClick={onRemove} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center mt-1">
          <Select value={usage} onValueChange={onUsageChange}>
            <SelectTrigger className="w-[110px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.includes('voice') && (
                <SelectItem value="voice">
                  <div className="flex items-center">
                    <MicVocal className="w-4 h-4 mr-2" />
                    Voice
                  </div>
                </SelectItem>
              )}
              {availableTypes.includes('avatar') && (
                <SelectItem value="avatar">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Avatar
                  </div>
                </SelectItem>
              )}
              {availableTypes.includes('media') && (
                <SelectItem value="media">
                  <div className="flex items-center">
                    <File className="w-4 h-4 mr-2" />
                    Media
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 ml-2 opacity-50" />
            </TooltipTrigger>
              <TooltipContent>
                <span>
                  {t("title")}<br/>
                  - <b>{t("voiceTitle")} :</b> {t("voice")}<br/>
                  - <b>{t("avatarTitle")} :</b> {t("avatar")}<br/>
                  - <b>{t("mediaTitle")} :</b> {t("media")}
                </span>
              </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}