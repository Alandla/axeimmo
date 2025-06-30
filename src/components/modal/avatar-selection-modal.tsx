'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { useTranslations } from "next-intl";
import { AvatarGridComponent } from "@/src/components/avatar-grid";
import { AvatarLook } from "@/src/types/avatar";
import { useState } from "react";

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
  
  // État local pour la sélection dans le modal
  const [localSelectedLook, setLocalSelectedLook] = useState<AvatarLook | null>(currentAvatar);
  const [localSelectedAvatarName, setLocalSelectedAvatarName] = useState<string | null>(
    currentAvatar ? currentAvatar.name || null : null
  );

  // Réinitialiser la sélection locale quand le modal s'ouvre
  const handleModalOpen = (open: boolean) => {
    if (open) {
      setLocalSelectedLook(currentAvatar);
      setLocalSelectedAvatarName(currentAvatar ? currentAvatar.name || null : null);
    }
  };

  const handleConfirm = () => {
    onAvatarChange(localSelectedLook);
    onClose();
  };

  const handleCancel = () => {
    // Reset to current avatar
    setLocalSelectedLook(currentAvatar);
    setLocalSelectedAvatarName(currentAvatar ? currentAvatar.name || null : null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel();
      handleModalOpen(open);
    }}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('select-avatar')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-visible">
          <AvatarGridComponent 
            mode="large" 
            selectedLook={localSelectedLook}
            onLookChange={setLocalSelectedLook}
            selectedAvatarName={localSelectedAvatarName}
            onAvatarNameChange={setLocalSelectedAvatarName}
            showNoAvatar={true}
          />
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