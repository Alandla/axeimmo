import { IMedia, ISequence } from "@/src/types/video";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ImageIcon } from "lucide-react";
import SkeletonVideo from "../ui/skeleton-video";
import SequenceSettingsSearch from "./sequence-settings-search";
import SequenceSettingsAssets from "./sequence-settings-assets";
import { useTranslations } from "next-intl";

export default function SequenceSettings({ sequence, sequenceIndex, setSequenceMedia, spaceId }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string }) {

  const t = useTranslations('edit.sequence-edit')

  return (
    <>
      <CardHeader>
        <CardTitle>Sequence {sequenceIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full mb-4 relative overflow-hidden rounded-md h-max-60">
            {!sequence.media?.image?.link ? (
                <ImageIcon className="w-full h-full text-gray-400" />
            ) : sequence.media.type === 'image' ? (
                <SkeletonImage src={sequence.media.image.link} width={sequence.media.image.width} height={sequence.media.image.height} alt={sequence.text} className="h-auto" style={{ width: 'auto', objectFit: 'contain' }} />
            ) : sequence.media.video ? (
                <SkeletonVideo srcImg={sequence.media.image.link} srcVideo={sequence.media.video.link} alt={sequence.text} className="h-auto" />
            ) : (
                <ImageIcon className="w-full h-full text-gray-400" />
            )}
        </div>

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