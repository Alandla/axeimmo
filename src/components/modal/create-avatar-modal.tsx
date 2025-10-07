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
import AvatarImagePickerDeck from "@/src/components/AvatarImagePickerDeck";

interface CreateAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAvatarModal({ isOpen, onClose }: CreateAvatarModalProps) {
  const t = useTranslations("avatars.create");
  const [tab, setTab] = useState<"pictures" | "idea">("pictures");
  const [ideaText, setIdeaText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [resetToken, setResetToken] = useState<number>(0);
  const { activeSpace } = useActiveSpaceStore();

  const handleStart = async () => {
    if (!activeSpace) return;

    if (tab === "idea") {
      const prompt = ideaText.trim();
      if (!prompt) return;

      try {
        setIsSubmitting(true);
        await basicApiCall(`/space/${activeSpace.id}/avatars`, { prompt });
        setIdeaText("");
        onClose();
      } catch (e) {
        console.error("Error creating avatar:", e);
      } finally {
        setIsSubmitting(false);
      }
    } else if (tab === "pictures") {
      if (!selectedImageUrl) return;
      try {
        setIsSubmitting(true);
        await basicApiCall(`/space/${activeSpace.id}/avatars`, { imageUrl: selectedImageUrl });
        setSelectedImageUrl("");
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
          setSelectedImageUrl("");
          setIdeaText("");
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
          setSelectedImageUrl("");
          setIdeaText("");
          setResetToken((n) => n + 1);
        }}>
          <TabsList className="w-full mb-4 gap-2 h-auto p-1">
            <TabsTrigger
              value="pictures"
              className="flex-1 text-left px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border data-[state=active]:border-border"
            >
              <div className="grid text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {t("from-pictures.title")}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("from-pictures.subtitle")}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="idea"
              className="flex-1 text-left px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border data-[state=active]:border-border"
            >
              <div className="grid text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {t("from-idea.title")}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("from-idea.subtitle")}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pictures" className="space-y-4">
            <AvatarImagePickerDeck
              dropHint={t("from-pictures.drop-hint")}
              onImageReady={(url) => setSelectedImageUrl(url)}
              disabled={isSubmitting}
              resetToken={resetToken}
            />
          </TabsContent>

          <TabsContent value="idea" className="space-y-4">
            <Textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder={t("from-idea.placeholder")}
              className="h-64 resize-none"
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleStart}
            disabled={
              isSubmitting ||
              !activeSpace ||
              (tab === "idea" && !ideaText.trim()) ||
              (tab === "pictures" && !selectedImageUrl)
            }
          >
            {tab === "pictures" ? t("create-avatar") : t("start")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAvatarModal;
