"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Plus,
  X,
  Send,
  Settings2,
  Check,
  PaintbrushVertical,
} from "lucide-react";
import { Avatar, AvatarLook } from "@/src/types/avatar";
import { basicApiCall } from "@/src/lib/api";
import { getMediaUrlFromFileByPresignedUrl } from "@/src/service/upload.service";
import { VideoFormat, VIDEO_FORMATS } from "@/src/types/video";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import StyleSelector from "@/src/components/style-selector";

// Limited format options for avatar look generation
type AvatarLookFormat = "vertical" | "horizontal";
type AvatarLookStyle = "ugc-realist" | "studio" | "podcast";

const AVATAR_LOOK_FORMATS = VIDEO_FORMATS.filter(
  (format) => format.value === "vertical" || format.value === "horizontal"
);

// Function to get format icon
const getFormatIcon = (format: AvatarLookFormat) => {
  switch (format) {
    case "vertical":
      return (
        <div className="h-4 w-2.5 border border-current rounded-sm flex-shrink-0" />
      );
    case "horizontal":
      return (
        <div className="h-2.5 w-4 border border-current rounded-sm flex-shrink-0" />
      );
    default:
      return null;
  }
};

type Props = {
  anchorRef: React.RefObject<HTMLDivElement>;
  activeAvatar: Avatar;
  spaceId: string;
  onRefresh: () => Promise<void> | void;
  initialReferenceImage?: string | null;
  shouldFocus?: boolean;
  onFocusComplete?: () => void;
};

const Thumbnails = React.memo(function Thumbnails({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 h-10">
      {urls.map((url, idx) => (
        <div key={`${url}-${idx}`} className="relative h-10 w-10 flex-shrink-0">
          <img
            src={url}
            alt="preview"
            className="h-10 w-10 object-cover rounded-md border"
          />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border shadow flex items-center justify-center"
            aria-label="remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
});

export function AvatarLookChatbox({
  anchorRef,
  activeAvatar,
  spaceId,
  onRefresh,
  initialReferenceImage,
  shouldFocus = false,
  onFocusComplete,
}: Props) {
  const t = useTranslations("avatars");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Removed custom picker state, now using Select primitives for reference image selection
  const [rect, setRect] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const [format, setFormat] = useState<AvatarLookFormat>("vertical");
  // Désactiver UGC: style par défaut 'studio' et empêcher la sélection UGC
  const [style, setStyle] = useState<AvatarLookStyle>("studio");
  const [isFocused, setIsFocused] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const candidateImages = useMemo(() => {
    const fromLooks = (activeAvatar?.looks || [])
      .map((l: AvatarLook) => l.thumbnail)
      .filter((u): u is string => !!u);
    const unique = Array.from(new Set(fromLooks));
    if (unique.length > 0) return unique;
    return activeAvatar?.thumbnail ? [activeAvatar.thumbnail] : [];
  }, [activeAvatar?.id, activeAvatar?.looks, activeAvatar?.thumbnail]);

  useEffect(() => {
    setReferenceImage((prev) => {
      // Si une image de référence initiale est fournie et qu'elle est valide, l'utiliser
      if (initialReferenceImage && candidateImages.includes(initialReferenceImage)) {
        return initialReferenceImage;
      }
      // Sinon, garder l'image actuelle si elle est toujours valide
      if (prev && candidateImages.includes(prev)) return prev;
      // Sinon, utiliser la première image disponible
      return candidateImages[0] ?? null;
    });
  }, [activeAvatar?.id, candidateImages, initialReferenceImage]);

  // Gérer le focus du prompt input
  useEffect(() => {
    if (shouldFocus && !isFocused) {
      console.log('Focus requested for chatbox');
      setIsFocused(true);
      
      // Essayer plusieurs fois de focuser l'élément
      const attemptFocus = (attempts = 0) => {
        if (attempts > 10) {
          console.log('Max focus attempts reached');
          return;
        }
        
        if (promptInputRef.current) {
          console.log(`Focusing input element (attempt ${attempts + 1})`);
          // S'assurer que l'élément est visible
          promptInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Forcer le focus - essayer plusieurs méthodes
          promptInputRef.current.focus();
          promptInputRef.current.click();
          
          // Vérifier si le focus a réussi
          setTimeout(() => {
            if (document.activeElement !== promptInputRef.current) {
              console.log('Focus failed, retrying...');
              attemptFocus(attempts + 1);
            } else {
              console.log('Input successfully focused');
            }
          }, 50);
        } else {
          console.log('Input ref not found, retrying...');
          setTimeout(() => attemptFocus(attempts + 1), 100);
        }
      };
      
      // Démarrer les tentatives de focus
      setTimeout(attemptFocus, 200);
    }
  }, [shouldFocus, isFocused]);

  // Animation: petit zoom puis de-zoom rapidement sans attendre le blur
  useEffect(() => {
    if (!shouldFocus) return;
    setIsPulsing(true);
    const t = setTimeout(() => setIsPulsing(false), 250);
    return () => clearTimeout(t);
  }, [shouldFocus]);

  // Removed popup listeners since we rely on Radix Select

  // Positionnement calé sur l'anchor via ResizeObserver
  useEffect(() => {
    if (!anchorRef.current) return;
    const el = anchorRef.current;
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, width: r.width });
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  // candidateImages is defined above using looks first

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const uploads: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const { mediaUrl } = await getMediaUrlFromFileByPresignedUrl(file);
        uploads.push(mediaUrl);
      }
      if (uploads.length > 0) setImages((prev) => [...prev, ...uploads]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() && style !== "podcast") return;
    setIsGenerating(true);
    try {
      await basicApiCall(
        `/space/${spaceId}/avatars/${activeAvatar.id}/looks/generate`,
        {
          description: prompt.trim() || " ", // Laisser un string non vide pour générer le podcast
          images: [referenceImage, ...images].filter((u): u is string => !!u),
          format,
          style,
        }
      );
      setPrompt("");
      setImages([]);
      await onRefresh();
    } finally {
      setIsGenerating(false);
    }
  };

  const popupDims = useMemo(() => {
    const maxWidth = 576; // max-w-xl = 36rem = 576px
    const availableWidth = rect.width || maxWidth;
    const width = Math.min(availableWidth, maxWidth);
    const left = rect.left + Math.max((availableWidth - width) / 2, 0);
    return { left, width };
  }, [rect.left, rect.width]);

  return (
    <div
      className="fixed bottom-8 z-50 max-w-xl"
      style={{ left: popupDims.left, width: popupDims.width }}
    >
      <div className={`bg-white border rounded-xl p-2 shadow-md transition-transform duration-200 ${isPulsing ? 'scale-105' : 'scale-100'}`}>
        {/* Top: prompt */}
        <div className="mb-2">
          <Input
            ref={promptInputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => {
              console.log('Input focused by user or programmatically');
            }}
            onBlur={() => {
              // Appeler onFocusComplete seulement quand l'utilisateur perd le focus
              if (shouldFocus && isFocused) {
                onFocusComplete?.();
                setIsFocused(false);
              }
            }}
            placeholder={`${t("look-chat.placeholder-1")}`}
            className={`w-full h-10 rounded-lg border-0 shadow-none bg-transparent focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all duration-150 ${isPulsing ? 'bg-gray-50 border border-gray-200' : ''}`}
          />
        </div>
        {/* Bottom bar: left elements + right send */}
        <div className="flex items-center justify-between gap-2">
          {/* Left block: look selector + separator + attachments */}
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Look selector */}
            <div className="relative flex-shrink-0 h-10">
              {referenceImage && (
                <Select
                  value={referenceImage}
                  onValueChange={(v) => setReferenceImage(v)}
                  disabled={isGenerating || isUploading}
                >
                  <SelectTrigger className="relative group h-10 w-10 p-0 overflow-hidden rounded-md border border-transparent focus:ring-0 focus:outline-none [&>svg]:hidden">
                    <SelectValue className="block h-full w-full">
                      <div className="relative h-full w-full">
                        <img src={referenceImage} alt="ref" className="block h-full w-full object-cover" />
                        <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40" />
                        <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Settings2 className="h-4 w-4 text-white" />
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" sideOffset={4} className="p-2 w-auto max-w-[90vw] min-w-0">
                    {candidateImages.map((u) => (
                      <SelectItem key={u} value={u} className="inline-flex w-auto p-0 mr-2 mb-2">
                        <div className="relative group/item">
                          <img
                            src={u}
                            alt="candidate"
                            className="h-20 w-auto max-w-[280px] object-contain rounded-md border hover:border-primary transition-colors"
                            loading="lazy"
                            decoding="async"
                          />
                          {referenceImage === u && (
                            <>
                              <span className="absolute inset-0 bg-black/50 rounded-md" />
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Check className="h-5 w-5 text-white" />
                              </span>
                            </>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {/* Separator */}
            <div className="h-6 w-px bg-gray-200" />
            {/* Attachments block */}
            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden">
              {images.length === 0 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaintbrushVertical className="h-4 w-4" />
                    {t("look-chat.add-elements")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </>
              ) : (
                <>
                  <Thumbnails urls={images} onRemove={removeImage} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* Right: style + format + send */}
          <div className="flex items-center gap-2">
            <StyleSelector
              value={style}
              onValueChange={(s) => {
                if (s === 'ugc-realist') return;
                setStyle(s);
              }}
              disabled={isGenerating || isUploading}
              hiddenStyles={['ugc-realist']}
            />
            <Select
              value={format}
              onValueChange={(value: string) =>
                setFormat(value as AvatarLookFormat)
              }
              onOpenChange={(open: boolean) => {
                if (open) {
                  try {
                    window.dispatchEvent(new CustomEvent('ratio-select-opened'))
                  } catch {}
                }
              }}
              disabled={isGenerating || isUploading}
            >
              <SelectTrigger variant="ghost" className="h-9 w-auto px-2">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getFormatIcon(format)}
                    <span className="text-sm">
                      {
                        AVATAR_LOOK_FORMATS.find((f) => f.value === format)
                          ?.ratio
                      }
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AVATAR_LOOK_FORMATS.map((formatOption) => (
                  <SelectItem
                    key={formatOption.value}
                    value={formatOption.value}
                  >
                    <div className="flex items-center gap-2">
                      {getFormatIcon(formatOption.value as AvatarLookFormat)}
                      <span>{formatOption.ratio}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              className="h-10 w-10 rounded-lg"
              disabled={
                isGenerating ||
                isUploading ||
                (!prompt.trim() && style !== "podcast")
              }
              onClick={handleGenerate}
              aria-label={t("look-chat.send") as string}
            >
              {isGenerating || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarLookChatbox;
