import { IMedia, ISequence } from "@/src/types/video";
import MediaGrid from "../ui/media-grid";

export default function SequenceSettingsAssets({ sequence, sequenceIndex, setSequenceMedia, spaceId }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string }) {
  return (
    <MediaGrid 
      spaceId={spaceId}
      mediaUsage="media"
      sequence={sequence}
      sequenceIndex={sequenceIndex}
      setSequenceMedia={setSequenceMedia}
      showUpload={true}
      showStorage={true}
    />
  )
}