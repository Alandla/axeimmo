import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTranslations } from 'next-intl';
import { IMedia } from '@/src/types/video';
import MediaGrid from '../ui/media-grid';

interface ElementsSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onElementSelect: (media: IMedia) => void;
  currentElement?: IMedia | null;
}

export function ElementsSelectionModal({
  isOpen,
  onClose,
  spaceId,
  onElementSelect,
  currentElement
}: ElementsSelectionModalProps) {
  const t = useTranslations('edit.elements');

  const handleElementSelect = (media: IMedia) => {
    console.log('handleElementSelect', media)
    onElementSelect(media);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('modal-title')}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <MediaGrid
            spaceId={spaceId}
            mediaUsage="element"
            onMediaSelect={handleElementSelect}
            selectedMedia={currentElement}
            showUpload={true}
            showStorage={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
