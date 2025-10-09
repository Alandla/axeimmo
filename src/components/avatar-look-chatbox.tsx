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
  Check,
  Settings2,
  PaintbrushVertical,
} from "lucide-react";
import { Avatar, AvatarLook } from "@/src/types/avatar";
import { basicApiCall } from "@/src/lib/api";
import { getMediaUrlFromFileByPresignedUrl } from "@/src/service/upload.service";
import { cn } from "@/src/lib/utils";
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
}: Props) {
  const t = useTranslations("avatars");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(
    activeAvatar?.thumbnail || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const refButtonRef = useRef<HTMLButtonElement | null>(null);
  const [pickerCoords, setPickerCoords] = useState<{
    left: number;
    bottom: number;
  }>({ left: 0, bottom: 0 });
  const [rect, setRect] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [format, setFormat] = useState<AvatarLookFormat>("vertical");
  // Désactiver UGC: style par défaut 'studio' et empêcher la sélection UGC
  const [style, setStyle] = useState<AvatarLookStyle>("studio");

  useEffect(() => {
    setReferenceImage(activeAvatar?.thumbnail || null);
  }, [activeAvatar?.id, activeAvatar?.thumbnail]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const pickerElement = document.querySelector("[data-picker-menu]");
      const buttonElement = refButtonRef.current;

      if (
        pickerElement &&
        !pickerElement.contains(target) &&
        buttonElement &&
        !buttonElement.contains(target)
      ) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

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

  const candidateImages = useMemo(() => {
    const list = [
      ...(activeAvatar?.thumbnail ? [activeAvatar.thumbnail] : []),
      ...activeAvatar.looks
        .map((l: AvatarLook) => l.thumbnail)
        .filter((u): u is string => !!u),
    ];
    return Array.from(new Set(list));
  }, [activeAvatar?.id, activeAvatar?.thumbnail, activeAvatar?.looks]);

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
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const podcastHint =
        " The scene is a podcast, the avatar is not looking at the camera, he is looking away as if he were talking, there is a microphone in front of him.";
      const finalPrompt =
        style === "podcast" ? `${prompt.trim()}${podcastHint}` : prompt.trim();
      await basicApiCall(
        `/space/${spaceId}/avatars/${activeAvatar.id}/looks/generate`,
        {
          description: finalPrompt,
          images: [referenceImage, ...images].filter((u): u is string => !!u),
          format,
          style,
        }
      );
      setPrompt("");
      setImages([]);
      setPickerOpen(false);
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
      <div className="bg-white border rounded-xl p-2 shadow-md">
        {/* Top: prompt */}
        <div className="mb-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`${t("look-chat.placeholder-1")}`}
            className="w-full h-10 rounded-lg border-0 shadow-none bg-transparent focus-visible:ring-0 focus:ring-0 focus:outline-none"
          />
        </div>
        {/* Bottom bar: left elements + right send */}
        <div className="flex items-center justify-between gap-2">
          {/* Left block: look selector + separator + attachments */}
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Look selector */}
            <div className="relative flex-shrink-0 h-10">
              {referenceImage && (
                <button
                  type="button"
                  className="group inline-flex items-center justify-center h-10 w-10 rounded-md overflow-hidden border flex-shrink-0 bg-white relative"
                  ref={refButtonRef}
                  onClick={() => {
                    const r = refButtonRef.current?.getBoundingClientRect();
                    if (r) {
                      setPickerCoords({
                        left: r.left,
                        bottom: window.innerHeight - r.top + 8,
                      });
                    }
                    setPickerOpen((v) => !v);
                  }}
                  title="Reference image"
                >
                  <img
                    src={referenceImage}
                    alt="ref"
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 hidden group-hover:block bg-black/40" />
                  <span className="pointer-events-none absolute inset-0 hidden group-hover:flex items-center justify-center">
                    <Settings2 className="h-4 w-4 text-white" />
                  </span>
                </button>
              )}
              {pickerOpen && (
                <div
                  data-picker-menu
                  className="fixed inline-block bg-white border rounded-2xl shadow-2xl p-3 z-[1000]"
                  style={{
                    left: pickerCoords.left,
                    bottom: pickerCoords.bottom,
                  }}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    {candidateImages.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className="relative h-28 rounded-xl overflow-hidden border bg-white flex-shrink-0"
                        onClick={() => {
                          setReferenceImage(u);
                          setPickerOpen(false);
                        }}
                        title="Select look"
                      >
                        <img
                          src={u}
                          alt="candidate"
                          className="h-full w-auto object-contain"
                        />
                        {referenceImage === u && (
                          <>
                            <span className="absolute inset-0 bg-black/50" />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Check className="h-6 w-6 text-white" />
                            </span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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
                    <PaintbrushVertical className="h-4 w-4 mr-1" />
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
              disabled={isGenerating || isUploading || !prompt.trim()}
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
