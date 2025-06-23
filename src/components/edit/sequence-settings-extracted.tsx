import { IMedia, ISequence } from "@/src/types/video";
import MediaItem from "../ui/media-item";
import { useTranslations } from "next-intl";

export default function SequenceSettingsExtracted({ 
  sequence, 
  sequenceIndex, 
  setSequenceMedia, 
  spaceId, 
  extractedMedia 
}: { 
  sequence: ISequence, 
  sequenceIndex: number, 
  setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, 
  spaceId: string,
  extractedMedia: IMedia[]
}) {
  const t = useTranslations('edit.sequence-edit-extracted')

  return (
    <>
      <div className="text-sm text-muted-foreground mb-4">
        {t('description')}
      </div>
      
      {extractedMedia.length > 0 ? (
        <div className="columns-3 gap-2">
          {extractedMedia.map((media, index) => (
            <MediaItem 
              key={index} 
              sequence={sequence} 
              sequenceIndex={sequenceIndex} 
              spaceId={spaceId} 
              media={media} 
              source='web'
              canRemove={false} 
              setSequenceMedia={setSequenceMedia} 
              onDeleteMedia={() => {}} // No delete functionality for extracted media
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          {t('no-extracted-media')}
        </div>
      )}
    </>
  )
} 