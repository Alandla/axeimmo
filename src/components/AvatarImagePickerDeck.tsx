"use client";

import { useEffect, useRef, useState } from "react";
import { UploadDropdown } from "@/src/components/upload-dropdown";
import { avatarsConfig } from "@/src/config/avatars.config";
import { getMediaUrlFromFileByPresignedUrl } from "@/src/service/upload.service";

export function AvatarImagePickerDeck({
  onImageReady,
  disabled = false,
  dropHint,
  resetToken = 0,
}: {
  onImageReady: (url: string) => void;
  disabled?: boolean;
  dropHint: string;
  resetToken?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isDeckGathered, setIsDeckGathered] = useState<boolean>(false);
  const [isDeckFlipped, setIsDeckFlipped] = useState<boolean>(false);
  const [isGatherDone, setIsGatherDone] = useState<boolean>(false);
  const [isUploadReady, setIsUploadReady] = useState<boolean>(false);
  const [revealFinalImage, setRevealFinalImage] = useState<boolean>(false);
  const [isFlipDone, setIsFlipDone] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const deckRef = useRef<HTMLDivElement | null>(null);
  const cardsGroupRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const openFilePicker = () => {
    if (disabled || isUploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || isUploadingImage) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || isUploadingImage) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset when leaving the container itself
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || isUploadingImage) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      setIsUploadingImage(true);
      setRevealFinalImage(false);
      setIsUploadReady(false);
      setIsGatherDone(false);
      setIsFlipDone(false);
      setIsDeckFlipped(false);
      // 1) Rassembler
      setIsDeckGathered(true);
      // 2) Uploader
      const { mediaUrl } = await getMediaUrlFromFileByPresignedUrl(file);
      setPreviewUrl(mediaUrl);
      setIsUploadReady(true);
    } catch (e) {
      console.error("Error uploading image:", e);
      setIsUploadingImage(false);
      setIsDeckGathered(false);
      setIsDeckFlipped(false);
      setIsGatherDone(false);
      setIsUploadReady(false);
    }
  };

  useEffect(() => {
    const node = cardsGroupRef.current;
    if (!node) return;
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (["transform", "left", "top"].includes(event.propertyName)) {
        setIsGatherDone(true);
      }
    };
    node.addEventListener("transitionend", handleTransitionEnd as any);
    return () => node.removeEventListener("transitionend", handleTransitionEnd as any);
  }, [isDeckGathered]);

  useEffect(() => {
    if (isDeckGathered && !isGatherDone) {
      const t = setTimeout(() => setIsGatherDone(true), 700);
      return () => clearTimeout(t);
    }
  }, [isDeckGathered, isGatherDone]);

  useEffect(() => {
    if (isGatherDone) {
      setIsFlipDone(false);
      const t = setTimeout(() => setIsDeckFlipped(true), 100);
      return () => clearTimeout(t);
    }
  }, [isGatherDone]);

  useEffect(() => {
    const deckNode = deckRef.current;
    if (!deckNode) return;
    const onDeckTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName === "transform") {
        setIsFlipDone(true);
      }
    };
    deckNode.addEventListener("transitionend", onDeckTransitionEnd as any);
    return () => deckNode.removeEventListener("transitionend", onDeckTransitionEnd as any);
  }, [isDeckFlipped]);

  useEffect(() => {
    if (isUploadReady && isGatherDone && isFlipDone && previewUrl) {
      // Add a tiny delay to ensure the flip animation fully settles
      // before revealing the final image when upload is extremely fast
      const revealDelay = setTimeout(() => {
        setRevealFinalImage(true);
        setIsUploadingImage(false);
        onImageReady(previewUrl);
      }, 150);
      return () => clearTimeout(revealDelay);
    }
  }, [isUploadReady, isGatherDone, isFlipDone, previewUrl, onImageReady]);

  // Reset interne quand resetToken change
  useEffect(() => {
    setIsUploadingImage(false);
    setIsDeckGathered(false);
    setIsDeckFlipped(false);
    setIsGatherDone(false);
    setIsUploadReady(false);
    setRevealFinalImage(false);
    setIsFlipDone(false);
    setPreviewUrl("");
  }, [resetToken]);

  return (
    <div
      className={`border rounded-md h-72 flex flex-col items-center justify-center text-muted-foreground transition-colors ${isDraggingOver ? 'border-primary/60 bg-primary/5' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative w-[260px] h-[160px] mb-10 perspective-1000">
        {/* Deck: face avant + face arrière */}
        <div ref={deckRef} className={`absolute inset-0 z-10 transition-transform duration-500 [transform-style:preserve-3d] ${isDeckFlipped ? 'rotate-y-180' : ''}`}>
          {/* Face avant */}
          <div className="absolute inset-0 backface-hidden">
            <div ref={cardsGroupRef} className="absolute inset-0">
              {[
                { idx: 0, key: 'c0', base: "left-0 top-2 -rotate-6 z-0" },
                { idx: 2, key: 'c1', base: "left-1/2 -translate-x-1/2 rotate-0 z-10" },
                { idx: 3, key: 'c2', base: "right-0 top-2 rotate-6 z-0" },
              ].map((cfg, i) => {
                const a = avatarsConfig[cfg.idx];
                const src = a?.thumbnail || a?.looks?.[0]?.thumbnail || "";
                return (
                  <img
                    key={cfg.key}
                    src={src}
                    alt="avatar placeholder"
                    className={
                      `absolute w-[120px] h-[160px] object-cover rounded-xl shadow-md transition-all duration-500 ` +
                      `${isDeckGathered ? 'left-1/2 -translate-x-1/2 rotate-0' : cfg.base} ` +
                      `${isDeckGathered ? `delay-[${i*75}ms]` : ''}`
                    }
                  />
                );
              })}
            </div>
          </div>
          {/* Face arrière */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center">
            <div className="w-[120px] h-[160px] rounded-xl shadow-md bg-gradient-to-br from-muted/70 to-muted/30 border border-border" />
          </div>
        </div>
        {/* Image finale */}
        <img
          src={previewUrl || ''}
          alt="selected"
          className={`absolute inset-0 m-auto w-[120px] h-[160px] object-cover rounded-xl shadow-md transition-opacity duration-300 ${revealFinalImage ? 'opacity-100 z-20' : 'opacity-0 z-0'} ${previewUrl ? '' : 'pointer-events-none'}`}
        />
      </div>
      <style jsx>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
      <div className="w-full flex justify-center items-center mb-2">
        <div className="text-sm ">{dropHint}</div>
        <UploadDropdown
          onFileUpload={openFilePicker}
          onAssetSelect={() => {}}
          disabled={disabled || isUploadingImage}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
    </div>
  );
}

export default AvatarImagePickerDeck;


