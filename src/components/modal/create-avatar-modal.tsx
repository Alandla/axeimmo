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
import { apiClient, basicApiCall } from "@/src/lib/api";
import AvatarImagePickerDeck from "@/src/components/AvatarImagePickerDeck";
import VideoFormatSelector from "@/src/components/edit/video-format-selector";
import { VideoFormat } from "@/src/types/video";
import type { Avatar } from "@/src/types/avatar";

interface CreateAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (avatar: Avatar) => void;
}

export function CreateAvatarModal({ isOpen, onClose, onCreated }: CreateAvatarModalProps) {
  const t = useTranslations("avatars.create");
  const [tab, setTab] = useState<"pictures" | "idea">("pictures");
  const [ideaText, setIdeaText] = useState<string>("");
  const [videoFormat, setVideoFormat] = useState<VideoFormat>("vertical");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [resetToken, setResetToken] = useState<number>(0);
  const { activeSpace } = useActiveSpaceStore();

  const handleStart = async () => {
    if (!activeSpace) return;

    if (tab === "idea") {
      const prompt = ideaText.trim();
      if (!prompt) return;

      try {
        setIsSubmitting(true);
        // Utiliser le client API direct pour récupérer l'avatar créé { data: Avatar }
        const res = await apiClient.post<{ data: Avatar }>(`/space/${activeSpace.id}/avatars`, {
          prompt,
          format: videoFormat,
        });
        const created = (res as any)?.data as Avatar | undefined;
        setIdeaText("");
        if (created && onCreated) onCreated(created);
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
          ? { imageUrl: selectedImageUrls[0] }
          : { imageUrls: selectedImageUrls };
        const res = await apiClient.post<{ data: Avatar }>(`/space/${activeSpace.id}/avatars`, payload);
        const created = (res as any)?.data as Avatar | undefined;
        setSelectedImageUrls([]);
        if (created && onCreated) onCreated(created);
        onClose();
      } catch (e) {
        console.error("Error creating avatar from image:", e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // L'animation et l'upload sont gérés par AvatarImagePickerDeck

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // reset state on close
          setSelectedImageUrls([]);
          setIdeaText("");
          setVideoFormat("vertical");
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
              <div className="absolute left-0 bottom-0 p-2">
                <VideoFormatSelector
                  value={videoFormat}
                  onValueChange={setVideoFormat}
                  disabled={isSubmitting}
                  light
                />
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
