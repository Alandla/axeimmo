import { IMedia, ISequence } from "@/src/types/video";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Globe, ImageIcon, Loader, Loader2, Plus, Search, Upload, Video } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import SkeletonVideo from "../ui/skeleton-video";
import { basicApiCall } from "@/src/lib/api";
import MediaItem from "../ui/media-item";
import { FileToUpload } from "@/src/types/files";
import { uploadFiles2 } from "@/src/service/upload.service";
import SequenceSettingsSearch from "./sequence-settings-search";
import SequenceSettingsAssets from "./sequence-settings-assets";

export default function SequenceSettings({ sequence, sequenceIndex, setSequenceMedia, spaceId }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, spaceId: string }) {
  const [searchType, setSearchType] = useState<'stock' | 'web'>('stock')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<IMedia[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)

  const fetchResults = async (keyword: string, page: number) => {
    setCurrentPage(page)
    setIsLoadingMedia(true)
    setSearchQuery(keyword)
    try {
      if (searchType === 'stock') {
        const results = await basicApiCall('/media/getPexelsVideo', { 
          keyword: keyword, 
          number: 10, 
          page : page
        }) as IMedia[]
        
        if (results.length > 0) {
          setSearchResults(prev => page === 1 ? results : [...prev, ...results])
        }
      } else if (searchType === 'web') {
        const results = await basicApiCall('/media/getGoogleImage', { 
          keyword: keyword, 
          number: 10, 
          page : page
        }) as IMedia[]
        
        if (results.length > 0) {
          setSearchResults(prev => page === 1 ? results : [...prev, ...results])
        }
      }
    } finally {
      setIsLoadingMedia(false)
    }
  }

  const handleFileUpload = async (newFiles: File[]) => {
    setIsUploadingFiles(true)
    const uploadedFiles: FileToUpload[] = newFiles.map(file => {
        return {
          file,
          type: "media",
          label: ''
        };
    });

    const files = await uploadFiles2(uploadedFiles)
    if (files.length > 0) {
        await basicApiCall('/space/addMedias', {
            spaceId: spaceId,
            medias: files
        })
    }
    setIsUploadingFiles(false)
  }

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
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
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