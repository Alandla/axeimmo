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
  const [localSelectedLook, setLocalSelectedLook] = useState<AvatarLook | null>(null);
  const [localSelectedAvatarName, setLocalSelectedAvatarName] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser les états une seule fois quand le modal s'ouvre
  if (isOpen && !isInitialized) {
    setLocalSelectedLook(currentAvatar);
    setLocalSelectedAvatarName(currentAvatar ? currentAvatar.name || null : null);
    setIsInitialized(true);
  }

  const handleConfirm = () => {
    onAvatarChange(localSelectedLook);
    onClose();
  };

  const handleCancel = () => {
    // Reset states to null (will be re-initialized on next open)
    setLocalSelectedLook(null);
    setLocalSelectedAvatarName(null);
    setIsInitialized(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel();
    }}>
      <DialogContent className="max-w-6xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('select-avatar')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto min-h-0 w-full">
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