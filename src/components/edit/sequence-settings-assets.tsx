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
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { PlanName } from "@/src/types/enums";
import { storageLimit } from "@/src/config/plan.config";
import { UsageStorage } from "../ui/usage-storage";
import { useAssetsStore } from "@/src/store/assetsStore";

export default function SequenceSettingsAssets({ sequence, sequenceIndex, setSequenceMedia, spaceId }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string }) {
  const { data: session } = useSession()
  const t = useTranslations('edit.sequence-edit-assets')
  const { assetsBySpace, fetchAssets: fetchAssetsFromStore, setAssets: setAssetsInStore } = useAssetsStore()

  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const { setSpaceId } = useMediaToDeleteStore()
  const { toast } = useToast()
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()

  const assetsToDisplay = assetsBySpace.get(spaceId) || []

  // Vérifier si l'utilisateur a un plan Pro ou Entreprise
  const hasPlan = activeSpace?.planName === PlanName.PRO || activeSpace?.planName === PlanName.ENTREPRISE
  
  // Calcul de l'utilisation du stockage
  const usedStorage = activeSpace?.usedStorageBytes || 0
  const storageMax = activeSpace?.storageLimit || (activeSpace?.planName ? storageLimit[activeSpace.planName] : storageLimit[PlanName.FREE])
  const storagePercentage = Math.min(Math.round((usedStorage / storageMax) * 100), 100);
  const isStorageFull = storagePercentage >= 100

  // Désactiver le bouton d'upload si l'utilisateur n'a pas de plan ou si le stockage est plein
  const isUploadDisabled = isUploadingFiles || !activeSpace?.id || isStorageFull

  useEffect(() => {
    // Vérifier si les assets sont déjà dans le store pour ce spaceId
    const currentAssetsInStore = assetsBySpace.get(spaceId);

    if (!currentAssetsInStore || currentAssetsInStore.length === 0) {
      const loadInitialAssets = async () => {
        await fetchAssetsFromStore(spaceId);
      };
      loadInitialAssets();
    }
    // setSpaceId pour useMediaToDeleteStore doit toujours être appelé lorsque spaceId change.
    setSpaceId(spaceId);
  }, [spaceId, fetchAssetsFromStore, setSpaceId, assetsBySpace]); // Ajout de assetsBySpace aux dépendances

  const onDeleteMedia = async (media: IMedia) => {
    toast({
      title: t('toast.deleting-file'),
      description: t('toast.deleting-file-description')
    })
    const currentAssets = assetsBySpace.get(spaceId) || [];
    const updatedAssets = currentAssets.filter(asset => asset.media.id !== media.id);
    setAssetsInStore(spaceId, updatedAssets);

    if (activeSpace && activeSpace.id === spaceId) {
      let storageToRemove = 0;
      if (media.type === 'image' && media.image && media.image.size) {
        storageToRemove += media.image.size;
      } else if (media.type === 'video' && media.video && media.video.size) {
        storageToRemove += media.video.size;
      }

      if (storageToRemove > 0) {
        setActiveSpace({
          ...activeSpace,
          usedStorageBytes: Math.max(0, (activeSpace.usedStorageBytes || 0) - storageToRemove)
        });
      }
    }
    
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

      let mediasToAnalyze: IMediaSpace[] = []
      if (medias.length > 0) {
        const { addedMedias, usedStorageBytes } = await basicApiCall('/space/addMedias', {
            spaceId: spaceId,
            medias
        }) as { addedMedias: IMediaSpace[], usedStorageBytes: number }

        mediasToAnalyze = addedMedias.filter(mediaSpace => {
          return !mediaSpace.media.description || mediaSpace.media.description[0].text === "";
        });

        setAssetsInStore(spaceId, addedMedias);

        if (activeSpace && activeSpace.id === spaceId) {
          setActiveSpace({
            ...activeSpace,
            usedStorageBytes: usedStorageBytes
          });
        }
      }
      setIsUploadingFiles(false)
      toast({
        title: t('toast.file-uploaded'),
        description: t('toast.file-uploaded-description'),
        variant: 'confirm'
      })

      if (mediasToAnalyze.length > 0) {
        for (const mediaSpace of mediasToAnalyze) {
          await basicApiCall('/media/analyze', {
            media: mediaSpace,
            spaceId: spaceId
          });
        }
      }
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
      <div className="mb-2">
        <UsageStorage 
          usedStorageBytes={activeSpace?.usedStorageBytes || 0} 
          planName={activeSpace?.planName || PlanName.FREE} 
          customStorageLimit={activeSpace?.storageLimit}
        />
      </div>
      <Button className="w-full" disabled={isUploadDisabled} onClick={() => document.getElementById('file-input')?.click()}>
        {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {t('upload-file-button')}
      </Button>
      <div className="mt-4 columns-3 gap-2">
          {assetsToDisplay.map((asset, index) => (
              <MediaItem key={index} sequence={sequence} sequenceIndex={sequenceIndex} spaceId={spaceId} media={asset.media} source='aws' canRemove={true} setSequenceMedia={setSequenceMedia} onDeleteMedia={onDeleteMedia} />
          ))}
      </div>
    </>
  )
}