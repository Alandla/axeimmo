import { File, Info, MicVocal, User, X, AudioLines } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { FileOrAssetToUpload } from "../types/files";
import Image from "next/image";

interface FileOrAssetPreviewProps {
  item: FileOrAssetToUpload;
  usage: "voice" | "avatar" | "media" | "element";
  onUsageChange: (newUsage: "voice" | "avatar" | "media" | "element") => void;
  onRemove: () => void;
}

// Type guard pour vérifier si c'est un FileToUpload ou AssetToUpload
const isFileToUpload = (item: FileOrAssetToUpload): item is Extract<FileOrAssetToUpload, { file: File }> => {
  return 'file' in item;
};

export function FileOrAssetPreview({ item, usage, onUsageChange, onRemove }: FileOrAssetPreviewProps) {
  const t = useTranslations("filePreview.tooltip");
  const [mediaUrl, setMediaUrl] = useState<string>("");

  useEffect(() => {
    if (isFileToUpload(item)) {
      const url = URL.createObjectURL(item.file);
      setMediaUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // Pour les assets existants, utiliser les liens ou frames disponibles
      const url = item.media.image?.link || 
                  (item.media.video?.frames && item.media.video.frames.length > 0 ? item.media.video.frames[0] : '');
      setMediaUrl(url);
    }
  }, [item]);

  const getAvailableTypes = (mediaType: string) => {
    switch (mediaType) {
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

  const mediaType = isFileToUpload(item) ? item.file.type.split('/')[0] : item.media.type;
  const availableTypes = getAvailableTypes(mediaType);

  const renderPreview = (mediaType: string, mediaUrl: string, name: string, isFile: boolean) => {
    if (!mediaUrl && mediaType !== 'audio') {
      return <File className="w-8 h-8 text-gray-500" />;
    }

    switch (mediaType) {
      case 'audio':
        return <AudioLines className="w-8 h-8 text-gray-500" />;
      case 'image':
        return isFile ? (
          <img src={mediaUrl} alt={name} className="w-full h-full object-cover rounded" />
        ) : (
          <Image 
            src={mediaUrl} 
            alt={name} 
            width={56} 
            height={56} 
            className="w-full h-full object-cover rounded" 
          />
        );
      case 'video':
        return isFile ? (
          <video src={mediaUrl} className="w-full h-full object-cover rounded" />
        ) : (
          <Image 
            src={mediaUrl} 
            alt={name} 
            width={56} 
            height={56} 
            className="w-full h-full object-cover rounded" 
          />
        );
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const displayName = isFileToUpload(item) ? item.file.name : item.media.name;
  const truncatedName = displayName.length > 12 ? `${displayName.slice(0, 12)}...` : displayName;

  return (
    <div className="flex items-start space-x-3 p-2 border rounded-lg">
      <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {renderPreview(mediaType, mediaUrl, displayName, isFileToUpload(item))}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate mr-2">
            {truncatedName}
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
