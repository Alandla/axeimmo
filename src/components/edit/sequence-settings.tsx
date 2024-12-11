import { IMedia, ISequence } from "@/src/types/video";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ImageIcon } from "lucide-react";
import SkeletonVideo from "../ui/skeleton-video";
import SequenceSettingsSearch from "./sequence-settings-search";
import SequenceSettingsAssets from "./sequence-settings-assets";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { IconEyeSlash } from "../icons/eye-slash";
import { IconEyeLowVision } from "../icons/eye-low-vision";
import { IconEye } from "../icons/eye";

export default function SequenceSettings({ sequence, sequenceIndex, setSequenceMedia, spaceId, hadAvatar }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string, hadAvatar: boolean }) {

  const t = useTranslations('edit.sequence-edit')

  return (
    <>
      <CardHeader className="p-2 sm:p-6">
        <CardTitle>Media {sequenceIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-2 pt-0 sm:p-6 sm:pt-0">

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
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="search">{t('search')}</TabsTrigger>
            <TabsTrigger value="assets">{t('assets')}</TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <SequenceSettingsSearch sequence={sequence} sequenceIndex={sequenceIndex} setSequenceMedia={setSequenceMedia} />
          </TabsContent>
          <TabsContent value="assets">
            <SequenceSettingsAssets sequence={sequence} sequenceIndex={sequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={spaceId} />
          </TabsContent>
        </Tabs>
      </CardContent>
      </>
  )
}