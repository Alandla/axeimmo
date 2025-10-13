"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { basicApiCall } from "@/src/lib/api";
import AvatarImagePickerDeck from "@/src/components/avatar-image-picker-deck";
import { VideoFormat, VIDEO_FORMATS } from "@/src/types/video";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { Avatar } from "@/src/types/avatar";
import { useAvatarsStore } from '@/src/store/avatarsStore'
import StyleSelector from "@/src/components/style-selector";

type AvatarStyle = 'ugc-realist' | 'studio' | 'podcast'

interface CreateAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (avatar: Avatar) => void;
}

export function CreateAvatarModal({ isOpen, onClose, onCreated }: CreateAvatarModalProps) {
  const t = useTranslations("avatars.create");
  const [tab, setTab] = useState<"pictures" | "idea">("pictures");
  const [ideaText, setIdeaText] = useState<string>("");
  // Limiter aux deux formats utilisés pour la génération d'avatars: vertical (9:16) et horizontal (16:9)
  const [videoFormat, setVideoFormat] = useState<Extract<VideoFormat, 'vertical' | 'horizontal'>>("vertical");
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("ugc-realist");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [resetToken, setResetToken] = useState<number>(0);
  const { activeSpace } = useActiveSpaceStore();
  const { fetchAvatarsInBackground, setAvatars } = useAvatarsStore()

  const handleStart = async () => {
    if (!activeSpace) return;

    if (tab === "idea") {
      const prompt = ideaText.trim();
      if (!prompt) return;

      try {
        setIsSubmitting(true);
        // Utiliser basicApiCall pour récupérer l'avatar créé
        const res = await basicApiCall<Avatar>(`/space/${activeSpace.id}/avatars`, {
          prompt,
          format: videoFormat,
          style: avatarStyle,
        });
        const created: Avatar = res;
        setIdeaText("");
        if (created) {
          if (onCreated) onCreated(created);
          // Mettre à jour le store immédiatement (insertion sans refetch)
          setAvatars(
            activeSpace.id,
            [
              created,
              ...((useAvatarsStore.getState().avatarsBySpace.get(activeSpace.id)) || [])
            ]
          )
        }
        onClose();
      } catch (e) {
        console.error("Error creating avatar:", e);
      } finally {
        setIsSubmitting(false);
      }
    } else if (tab === "pictures") {
      if (!selectedImageUrls.length) return;
      try {
        setIsSubmitting(true);
        const payload = selectedImageUrls.length === 1
          ? { imageUrl: selectedImageUrls[0], style: avatarStyle }
          : { imageUrls: selectedImageUrls, style: avatarStyle };
        const res = await basicApiCall<Avatar>(`/space/${activeSpace.id}/avatars`, payload);
        const created: Avatar = res;
        setSelectedImageUrls([]);
        if (created) {
          if (onCreated) onCreated(created);
          // Mettre à jour le store immédiatement (insertion sans refetch)
          setAvatars(
            activeSpace.id,
            [
              created,
              ...((useAvatarsStore.getState().avatarsBySpace.get(activeSpace.id)) || [])
            ]
          )
        }
        onClose();
      } catch (e) {
        console.error("Error creating avatar from image:", e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // reset state on close
          setSelectedImageUrls([]);
          setIdeaText("");
          setVideoFormat("vertical");
          setAvatarStyle("ugc-realist");
          setResetToken((n) => n + 1);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => {
          setTab(v as any);
          // reset state on tab change
          setSelectedImageUrls([]);
          setIdeaText("");
          setVideoFormat("vertical");
          setAvatarStyle("ugc-realist");
          setResetToken((n) => n + 1);
        }}>
          <TabsList className="w-full mb-4 gap-2 h-auto p-1">
            <TabsTrigger
              value="pictures"
              className="flex-1 text-left px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border justify-start"
            >
              <div className="grid text-left text-sm leading-tight w-full">
                <span className="truncate font-semibold text-left">
                  {t("from-pictures.title")}
                </span>
                <span className="truncate text-xs text-muted-foreground text-left">
                  {t("from-pictures.subtitle")}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="idea"
              className="flex-1 text-left px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border justify-start"
            >
              <div className="grid text-left text-sm leading-tight w-full">
                <span className="truncate font-semibold text-left">
                  {t("from-idea.title")}
                </span>
                <span className="truncate text-xs text-muted-foreground text-left">
                  {t("from-idea.subtitle")}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pictures" className="space-y-4 h-[280px]">
            <AvatarImagePickerDeck
              dropHint={t("from-pictures.drop-hint")}
              onImagesChange={(urls) => setSelectedImageUrls(urls)}
              disabled={isSubmitting}
              resetToken={resetToken}
            />
          </TabsContent>

          <TabsContent value="idea" className="space-y-4 h-[280px]">
            <div className="relative h-[280px]">
              <Textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder={t("from-idea.placeholder")}
                className="h-full resize-none pr-2 pb-14"
              />
              <div className="absolute right-0 bottom-0 p-2 flex items-center gap-2">
                <StyleSelector
                  value={avatarStyle}
                  onValueChange={setAvatarStyle}
                  disabled={isSubmitting}
                  light
                />
                <Select 
                  value={videoFormat}
                  onValueChange={(value: string) => setVideoFormat(value as any)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger variant="ghost" className="h-8 w-auto px-2">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {videoFormat === 'vertical' ? (
                          <div className="h-4 w-2.5 border border-current rounded-sm flex-shrink-0" />
                        ) : videoFormat === 'horizontal' ? (
                          <div className="h-2.5 w-4 border border-current rounded-sm flex-shrink-0" />
                        ) : null}
                        <span className="text-sm">
                          {VIDEO_FORMATS.find(f => f.value === videoFormat)?.ratio}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_FORMATS.filter(f => f.value === 'vertical' || f.value === 'horizontal').map((formatOption) => (
                      <SelectItem key={formatOption.value} value={formatOption.value}>
                        <div className="flex items-center gap-2">
                          {formatOption.value === 'vertical' ? (
                            <div className="h-4 w-2.5 border border-current rounded-sm flex-shrink-0" />
                          ) : (
                            <div className="h-2.5 w-4 border border-current rounded-sm flex-shrink-0" />
                          )}
                          <span>{formatOption.ratio}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Button
            onClick={handleStart}
            disabled={
              isSubmitting ||
              !activeSpace ||
              (tab === "idea" && !ideaText.trim()) ||
              (tab === "pictures" && selectedImageUrls.length === 0)
            }
            className="w-full"
          >
            {t("start")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAvatarModal;
