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

export default function SequenceSettings({ sequence, sequenceIndex, setSequenceMedia }: { sequence: ISequence, sequenceIndex: number, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void }) {
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
    console.log(files)
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
            <form onSubmit={(e) => { e.preventDefault(); fetchResults(searchQuery, 1) }} className="space-y-2 md:space-y-0 md:flex md:gap-2">
              <Input placeholder="Search media..." className="w-full md:flex-grow" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Select value={searchType} onValueChange={(value: 'stock' | 'web') => setSearchType(value)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">
                    <span className="flex items-center">
                      <ImageIcon size={16} className="mr-2" /> Stock
                    </span>
                  </SelectItem>
                  <SelectItem value="web">
                    <span className="flex items-center">
                      <Globe size={16} className="mr-2" /> Web
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full md:w-auto">
                {isLoadingMedia ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </Button>
            </form>
            <div className="mt-2 flex flex-wrap gap-2">
              {sequence.keywords?.slice(0, 3).map((keyword, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => fetchResults(keyword.keyword, 1)}
                >
                  {keyword.keyword}
                  <Search size={12} />
                </Button>
              ))}
            </div>
            <div className="mt-4 columns-3 gap-2">
                {searchResults.map((media, index) => (
                    <MediaItem key={index} sequence={sequence} sequenceIndex={sequenceIndex} media={media} source='web' setShowModalRemoveMedia={() => {}} setSequenceMedia={setSequenceMedia} />
                ))}
            </div>
            <div className="flex justify-center">
                <Button 
                    className="mt-4" 
                    disabled={searchResults.length === 0 || isLoadingMedia}
                    onClick={() => fetchResults(searchQuery, currentPage + 1)}
                >
                    {isLoadingMedia ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Load more
                </Button>
            </div>
          </TabsContent>
          <TabsContent value="assets">
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
          </TabsContent>
        </Tabs>
      </CardContent>
      </>
  )
}