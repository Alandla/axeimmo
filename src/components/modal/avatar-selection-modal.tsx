'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { useTranslations } from "next-intl";
import { AvatarGridComponent } from "@/src/components/avatar-grid";
import { AvatarLook } from "@/src/types/avatar";
import { useCreationStore } from "@/src/store/creationStore";
import { useEffect } from "react";

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: AvatarLook | null;
  onAvatarChange: (avatar: AvatarLook | null) => void;
}

export function AvatarSelectionModal({
  isOpen,
  onClose,
  currentAvatar,
  onAvatarChange
}: AvatarSelectionModalProps) {
  const t = useTranslations("edit");
  const { selectedLook, setSelectedLook } = useCreationStore();

  // Initialize selected look with current avatar when modal opens
  useEffect(() => {
    if (isOpen && currentAvatar) {
      setSelectedLook(currentAvatar);
    }
  }, [isOpen, currentAvatar, setSelectedLook]);

  const handleConfirm = () => {
    onAvatarChange(selectedLook);
    onClose();
  };

  const handleCancel = () => {
    // Reset to current avatar
    setSelectedLook(currentAvatar);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('select-avatar')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-visible">
          <AvatarGridComponent mode="large" />
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 