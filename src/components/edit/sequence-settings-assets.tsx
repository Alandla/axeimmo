import { IMedia, ISequence } from "@/src/types/video";
import { Loader2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { basicApiCall } from "@/src/lib/api";
import MediaItem from "../ui/media-item";
import { FileToUpload } from "@/src/types/files";
import { uploadFiles2 } from "@/src/service/upload.service";
import { IMediaSpace } from "@/src/types/space";
import { useSession } from "next-auth/react";

export default function SequenceSettingsAssets({ sequence, sequenceIndex, setSequenceMedia, spaceId }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string }) {
  const { data: session } = useSession()

  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [assets, setAssets] = useState<IMediaSpace[]>([])

  useEffect(() => {
    const fetchAssets = async () => {
      const assets: IMediaSpace[] = await basicApiCall('/space/getMedias', { spaceId })
      setAssets(assets)
    }
    fetchAssets()
  }, [])

  const handleFileUpload = async (newFiles: File[]) => {
    setIsUploadingFiles(true)
    const uploadedFiles: FileToUpload[] = newFiles.map(file => {
        return {
          file,
          type: "media",
          label: ''
        };
    });

    const files: IMedia[] = await uploadFiles2(uploadedFiles)

    const medias: IMediaSpace[] = files.map(file => {
      return {
        media: file,
        uploadedBy: session?.user?.id || '',
        uploadedAt: new Date()
      }
    })

    if (medias.length > 0) {
      await basicApiCall('/space/addMedias', {
          spaceId: spaceId,
          medias
      })
      setAssets(prevAssets => prevAssets ? [...prevAssets, ...medias] : [...medias])
    }
    setIsUploadingFiles(false)
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
        Upload a file
      </Button>
      <div className="mt-4 columns-3 gap-2">
          {assets && assets.map((asset, index) => (
              <MediaItem key={index} sequence={sequence} sequenceIndex={sequenceIndex} media={asset.media} source='web' setShowModalRemoveMedia={() => {}} setSequenceMedia={setSequenceMedia} />
          ))}
      </div>
    </>
  )
}