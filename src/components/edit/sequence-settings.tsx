import { IMedia, ISequence } from "@/src/types/video";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SequenceSettingsSearch from "./sequence-settings-search";
import SequenceSettingsAssets from "./sequence-settings-assets";
import SequenceSettingsExtracted from "./sequence-settings-extracted";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { IconEyeSlash } from "../icons/eye-slash";
import { IconEyeLowVision } from "../icons/eye-low-vision";
import { IconEye } from "../icons/eye";
import VideoTrim from "./video-trim";
import { Sparkles } from 'lucide-react';
import ImageToVideoModal from '@/src/components/modal/image-to-video-modal';
import ModalPricing from '@/src/components/modal/modal-pricing';
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore';
import { PlanName } from '@/src/types/enums';
import { useAssetsStore } from '@/src/store/assetsStore';
import { IMediaSpace } from '@/src/types/space';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useTranslations as useAssetsTranslations } from 'next-intl';

export default function SequenceSettings({ sequence, sequenceIndex, setSequenceMedia, spaceId, hadAvatar, keywords, extractedMedia }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string, hadAvatar: boolean, keywords: string[], extractedMedia?: IMedia[] }) {

  const t = useTranslations('edit.sequence-edit')
  const tAssets = useAssetsTranslations('assets')

  const { activeSpace } = useActiveSpaceStore()
  const { assetsBySpace, setAssets: setAssetsInStore } = useAssetsStore()
  const { data: session } = useSession()

  const [showImageToVideoModal, setShowImageToVideoModal] = useState(false)
  const [showModalPricing, setShowModalPricing] = useState(false)
  const [modalPricingTitle, setModalPricingTitle] = useState('')
  const [modalPricingDescription, setModalPricingDescription] = useState('')

  const handleGenerateVideoClick = () => {
    if (!sequence.media || sequence.media.type !== 'image') return

    if (activeSpace?.planName === PlanName.FREE || activeSpace?.planName === PlanName.START) {
      setModalPricingTitle(tAssets('video-generation-premium-title'))
      setModalPricingDescription(tAssets('video-generation-premium-description'))
      setShowModalPricing(true)
      return
    }

    setShowImageToVideoModal(true)
  }

  const handleImageToVideoSuccess = (generatedMediaSpace: IMediaSpace) => {
    if (!activeSpace?.id) return
    const currentAssets = assetsBySpace.get(activeSpace.id) || []
    setAssetsInStore(activeSpace.id, [...currentAssets, generatedMediaSpace])
  }

  return (
    <>
      <CardHeader className="p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle>Media {sequenceIndex + 1}</CardTitle>
          {sequence.media && sequence.media.type === 'image' && (sequence.media as any).id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateVideoClick}
              className="flex items-center"
            >
              <Sparkles className="h-4 w-4" />
              {tAssets('enhance-button-image')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-2 pt-0 sm:p-6 sm:pt-0">
        {sequence.media?.type === 'video' && (
          <VideoTrim 
            sequence={sequence} 
            sequenceIndex={sequenceIndex} 
            setSequenceMedia={setSequenceMedia}
          />
        )}

        {hadAvatar && (
          <div className="flex w-full">
            <Button
              variant={sequence.media?.show === 'hide' ? "default" : "outline"}
              className="flex-1 rounded-r-none"
              onClick={() => setSequenceMedia(sequenceIndex, { ...sequence.media, show: 'hide' } as IMedia)}
            >
              <IconEyeSlash className="h-4 w-4" />
              {t('hide-button')}
            </Button>
            <Button
              variant={sequence.media?.show === 'half' ? "default" : "outline"}
              className="flex-1 rounded-none border-x-0"
              onClick={() => setSequenceMedia(sequenceIndex, { ...sequence.media, show: 'half' } as IMedia)}
            >
              <IconEyeLowVision className="h-4 w-4" />
              {t('half-button')}
            </Button>
            <Button
              variant={sequence.media?.show === 'full' ? "default" : "outline"}
              className="flex-1 rounded-l-none"
              onClick={() => setSequenceMedia(sequenceIndex, { ...sequence.media, show: 'full' } as IMedia)}
            >
              <IconEye className="h-4 w-4" />
              {t('full-button')}
            </Button>
          </div>
        )}

        <Tabs defaultValue="search">
          <TabsList className={`grid w-full mb-4 ${extractedMedia && extractedMedia.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="search">{t('search')}</TabsTrigger>
            <TabsTrigger value="assets">{t('assets')}</TabsTrigger>
            {extractedMedia && extractedMedia.length > 0 && (
              <TabsTrigger value="extracted">{t('extracted')}</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="search">
            <SequenceSettingsSearch sequence={sequence} sequenceIndex={sequenceIndex} setSequenceMedia={setSequenceMedia} keywords={keywords} />
          </TabsContent>
          <TabsContent value="assets">
            <SequenceSettingsAssets sequence={sequence} sequenceIndex={sequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={spaceId} />
          </TabsContent>
          {extractedMedia && extractedMedia.length > 0 && (
            <TabsContent value="extracted">
              <SequenceSettingsExtracted sequence={sequence} sequenceIndex={sequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={spaceId} extractedMedia={extractedMedia} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Modals */}
      {sequence.media && sequence.media.type === 'image' && (
        <ImageToVideoModal
          mediaSpace={{
            id: (sequence.media as any).id,
            media: sequence.media,
            uploadedBy: session?.user?.id || '',
            uploadedAt: new Date()
          }}
          open={showImageToVideoModal}
          onClose={() => setShowImageToVideoModal(false)}
          onSuccess={handleImageToVideoSuccess}
        />
      )}

      <ModalPricing
        title={modalPricingTitle}
        description={modalPricingDescription}
        isOpen={showModalPricing}
        setIsOpen={setShowModalPricing}
        features={{
          credits: true,
          videoMinutes: true,
          videoExports: true,
          imageToVideoLimit: true,
          urlToVideo: false
        }}
      />
    </>
  )
}