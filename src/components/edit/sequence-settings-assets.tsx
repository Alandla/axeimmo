import { IMedia, ISequence } from "@/src/types/video";
import { Loader2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { basicApiCall } from "@/src/lib/api";
import MediaItem from "../ui/media-item";
import { FileToUpload } from "@/src/types/files";
import { uploadFiles } from "@/src/service/upload.service";
import { IMediaSpace } from "@/src/types/space";
import { useSession } from "next-auth/react";
import { useMediaToDeleteStore } from "@/src/store/mediaToDelete";
import { useToast } from "@/src/hooks/use-toast";
import { useTranslations } from "next-intl";

export default function SequenceSettingsAssets({ sequence, sequenceIndex, setSequenceMedia, spaceId }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string }) {
  const { data: session } = useSession()
  const t = useTranslations('edit.sequence-edit-assets')

  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [assets, setAssets] = useState<IMediaSpace[]>([])
  const { setSpaceId } = useMediaToDeleteStore()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAssets = async () => {
      const assets: IMediaSpace[] = await basicApiCall('/space/getMedias', { spaceId })
      setAssets(assets)
    }
    setSpaceId(spaceId)
    fetchAssets()
  }, [])

  const onDeleteMedia = async (mediaId: string) => {
    toast({
      title: t('toast.deleting-file'),
      description: t('toast.deleting-file-description')
    })
    const updatedAssets = assets.filter(asset => asset.media.id !== mediaId);
    setAssets(updatedAssets);
    toast({
      title: t('toast.file-deleted'),
      description: t('toast.file-deleted-description'),
      variant: 'confirm'
    })
  }

  const handleFileUpload = async (newFiles: File[]) => {
    toast({
      title: t('toast.uploading-file'),
      description: t('toast.uploading-file-description')
    })
    try {
      setIsUploadingFiles(true)
      const uploadedFiles: FileToUpload[] = newFiles.map(file => {
          const type = file.type.startsWith('image/') ? "image" : file.type.startsWith('video/') ? "video" : "audio";
          return {
            file,
            type,
            usage: "media",
            label: ''
          };
      });

      const files: IMedia[] = await uploadFiles(uploadedFiles)

      const medias: IMediaSpace[] = files.map(file => {
        return {
          media: file,
          uploadedBy: session?.user?.id || '',
          uploadedAt: new Date()
        }
      })

      if (medias.length > 0) {
        const addedMedias: IMediaSpace[] = await basicApiCall('/space/addMedias', {
            spaceId: spaceId,
            medias
        })
        setAssets(addedMedias)
      }
      setIsUploadingFiles(false)
      toast({
        title: t('toast.file-uploaded'),
        description: t('toast.file-uploaded-description'),
        variant: 'confirm'
      })
    } catch (error) {
      setIsUploadingFiles(false)
      console.error(error)
      toast({
        title: t('toast.title-error'),
        description: t('toast.deleting-file-error'),
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*"
          onChange={(e) => {
          if (e.target.files) {
              handleFileUpload(Array.from(e.target.files));
          }
          }}
      />
      <Button className="w-full" disabled={isUploadingFiles} onClick={() => document.getElementById('file-input')?.click()}>
        {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {t('upload-file-button')}
      </Button>
      <div className="mt-4 columns-3 gap-2">
          {assets && assets.map((asset, index) => (
              <MediaItem key={index} sequence={sequence} sequenceIndex={sequenceIndex} media={asset.media} source='web' canRemove={true} setSequenceMedia={setSequenceMedia} onDeleteMedia={onDeleteMedia} />
          ))}
      </div>
    </>
  )
}