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
} from "lucide-react"
import Image from "next/image";
import { Avatar, AvatarLook, AvatarStyle } from "@/src/types/avatar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import StyleSelector from "@/src/components/style-selector";
import { useAvatarsStore } from '@/src/store/avatarsStore'
import { motion } from "framer-motion"
import { AVATAR_LOOK_GENERATION_COST } from "@/src/lib/cost"
import { useToast } from "@/src/hooks/use-toast"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { Textarea } from "./ui/textarea";

// Limited format options for avatar look generation
type AvatarLookFormat = "vertical" | "horizontal";
type AvatarLookStyle = AvatarStyle;

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
  promptInputRef: React.RefObject<HTMLTextAreaElement>;
  pulseSignal?: number;
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
          <Image
            src={url}
            alt="preview"
            className="h-10 w-10 object-cover rounded-md border"
            width={40}
            height={40}
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
  promptInputRef,
  pulseSignal = 0,
}: Props) {
  const t = useTranslations("avatars");
  const tAssets = useTranslations("assets");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Removed custom picker state, now using Select primitives for reference image selection
  // CSS-only positioning: no rect state needed
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [format, setFormat] = useState<AvatarLookFormat>("vertical");
  // Désactiver UGC: style par défaut 'studio' et empêcher la sélection UGC
  const [style, setStyle] = useState<AvatarLookStyle>("studio");
  const { setAvatars, fetchAvatarsInBackground, avatarsBySpace } = useAvatarsStore()
  const { toast } = useToast();
  const { activeSpace, decrementCredits } = useActiveSpaceStore();

  // Check if user has enough credits
  const hasInsufficientCredits = activeSpace ? activeSpace.credits < AVATAR_LOOK_GENERATION_COST : false;

  const candidateImages = useMemo(() => {
    const fromLooks = (activeAvatar?.looks || [])
      .map((l: AvatarLook) => l.thumbnail)
      .filter((u): u is string => !!u);
    const unique = Array.from(new Set(fromLooks));
    if (unique.length > 0) return unique;
    return activeAvatar?.thumbnail ? [activeAvatar.thumbnail] : [];
  }, [activeAvatar?.id, activeAvatar?.looks, activeAvatar?.thumbnail]);

  // Pré-calculer la largeur idéale pour chaque vignette à hauteur 80px (h-20)
  const [candidateWidths, setCandidateWidths] = useState<Record<string, number>>({})

  useEffect(() => {
    if (candidateImages.length === 0) return
    let cancelled = false
    const load = async (url: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image()
        img.onload = () => {
          if (cancelled) return resolve()
          const naturalWidth = img.naturalWidth || 0
          const naturalHeight = img.naturalHeight || 1
          const ratio = naturalWidth / naturalHeight
          const targetHeight = 80 // px (h-20)
          const computedWidth = Math.min(280, Math.max(80, Math.round(ratio * targetHeight)))
          setCandidateWidths((prev) => (prev[url] ? prev : { ...prev, [url]: computedWidth }))
          resolve()
        }
        img.onerror = () => resolve()
        img.src = url
      })
    // Lancer en parallèle
    Promise.all(candidateImages.map(load))
    return () => {
      cancelled = true
    }
  }, [candidateImages])

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

  // CSS-only positioning: no observers/listeners needed

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
    
    // Check credits before starting
    if (hasInsufficientCredits) {
      toast({
        title: tAssets("insufficient-credits"),
        description: tAssets("insufficient-credits-description"),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await basicApiCall<{ data: AvatarLook }>(
        `/space/${spaceId}/avatars/${activeAvatar.id}/looks/generate`,
        {
          description: prompt.trim() || " ", // Laisser un string non vide pour générer le podcast
          images: [referenceImage, ...images].filter((u): u is string => !!u),
          format,
          style,
        }
      );
      const createdLook = (res as any)?.data as AvatarLook | undefined
      if (createdLook) {
        // Optimistic: insérer le look dans le store pour l'avatar courant
        setAvatars(
          spaceId,
          (avatarsBySpace.get(spaceId) || []).map(a =>
            a.id === activeAvatar.id
              ? {
                  ...a,
                  looks: [...a.looks, createdLook],
                  thumbnail: a.thumbnail || createdLook.thumbnail || a.thumbnail,
                }
              : a
          )
        )
      }
      setPrompt("");
      setImages([]);
      // Decrement credits in UI
      decrementCredits(AVATAR_LOOK_GENERATION_COST);
      // Rafraîchir en arrière-plan sans bloquer l'UI
      try { fetchAvatarsInBackground(spaceId) } catch {}
      try { onRefresh?.() } catch {}
    } catch (e: any) {
      console.error("Error generating look:", e);
      // Handle 402 error (insufficient credits)
      if (e?.response?.status === 402 || e?.status === 402) {
        toast({
          title: tAssets("insufficient-credits"),
          description: tAssets("insufficient-credits-description"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("toast.error-title"),
          description: t("toast.look-generation-error"),
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // CSS-only positioning: compute nothing in JS

  return (
    <div
      className="fixed bottom-8 inset-x-0 z-50 w-full md:pl-[--sidebar-width]"
    >
      <motion.div
        key={pulseSignal}
        initial={{ scale: 1 }}
        animate={pulseSignal > 0 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, times: [0, 0.5, 1], ease: "easeOut" }}
        className={"w-full max-w-xl mx-auto bg-white border rounded-xl p-2 shadow-md"}
      >
        {/* Top: prompt */}
        <div className="mb-2">
          <Textarea
            ref={promptInputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`${t("look-chat.placeholder-1")}`}
           className="w-full pt-2 resize-none overflow-hidden border-0 shadow-none"
           variant="no-focus-border"
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
                        <Image src={referenceImage} alt="ref" className="block h-full w-full object-contain" width={40} height={40} />
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
                        <div
                          className="relative group/item h-20"
                          style={{ width: `${candidateWidths[u] ?? 280}px` }}
                        >
                          <Image
                            src={u}
                            alt="candidate"
                            fill
                            className="object-cover rounded-md transition-colors"
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 640px) 45vw, 280px"
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
                if (s === 'selfie') return;
                setStyle(s);
              }}
              disabled={isGenerating || isUploading}
              hiddenStyles={['selfie', 'srpo-car']}
            />
            <Select
              value={format}
              onValueChange={(value: string) =>
                setFormat(value as AvatarLookFormat)
              }
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
            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-lg"
                    disabled={
                      isGenerating ||
                      isUploading ||
                      (!prompt.trim() && style !== "podcast") ||
                      hasInsufficientCredits
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("look-chat.cost-tooltip", { cost: AVATAR_LOOK_GENERATION_COST })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AvatarLookChatbox;
