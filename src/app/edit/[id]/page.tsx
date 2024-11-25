'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayerRef } from '@remotion/player'
import { Button } from "@/src/components/ui/button"
import { Card } from "@/src/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/src/components/ui/breadcrumb"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/src/components/ui/resizable"
import { Download, Save, Loader2, ListVideo, Subtitles as SubtitlesIcon } from 'lucide-react'
import Link from 'next/link'
import Sequence from '@/src/components/edit/sequence'
import SequenceSettings from '@/src/components/edit/sequence-settings'
import VideoPreview from '@/src/components/edit/video-preview'
import { useParams } from 'next/navigation'
import { basicApiCall, basicApiGetCall } from '@/src/lib/api'
import { IVideo } from '@/src/types/video'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { IMedia } from '@/src/types/video'
import ModalConfirmExport from '@/src/components/modal/confirm-export'
import { IExport } from '@/src/types/export'
import { useToast } from '@/src/hooks/use-toast'
import Panel1 from '@/src/components/edit/panel-1'
import Subtitles from '@/src/components/edit/subtitles'
import SubtitleSettings from '@/src/components/edit/subtitle-settings'

export default function VideoEditor() {
  const { id } = useParams()
  const { toast } = useToast()
  const t = useTranslations('edit')

  const [video, setVideo] = useState<IVideo | null>(null)
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0)
  const [activeTabMobile, setActiveTabMobile] = useState('sequences')
  const [activeTab1, setActiveTab1] = useState('sequences')
  const previewRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showModalExport, setShowModalExport] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const updateVideo = (newVideoData: any) => {
    setVideo(newVideoData)
    setIsDirty(true)
  }

  const handleWordInputChange = (sequenceIndex: number, wordIndex: number, newWord: string) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences]
      newSequences[sequenceIndex].words[wordIndex].word = newWord
      newSequences[sequenceIndex].text = newSequences[sequenceIndex].words.map(word => word.word).join(' ')
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } })
    }
  }

  const handleCutSequence = (cutIndex: number) => {
    console.log("cutIndex", cutIndex)
  }

  const handleSaveVideo = async () => {
    setIsSaving(true)
    toast({
      title: t('toast.title-saving'),
      description: t('toast.description-saving'),
      variant: 'loading'
    })
    await basicApiCall('/video/save', { video })
    setIsDirty(false)
    toast({
      title: t('toast.title-saved'),
      description: t('toast.description-saved'),
      variant: 'confirm',
    })
    setIsSaving(false)
  }

  const setSequenceMedia = (sequenceIndex: number, media: IMedia) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences]
      newSequences[sequenceIndex].media = media
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } })
    }
  }

  const setSubtitleStyle = (subtitle: any) => {
    if (video && video.video) {
      const newVideo = { ...video, video: { ...video.video, subtitle } }
      updateVideo(newVideo)
    }
  }

  const updateSubtitleStyle = (newStyleProps: any) => {
    if (video?.video?.subtitle) {
      console.log('video', video)
      const updatedVideo = {
        ...video,
        video: {
          ...video.video,
          subtitle: {
            ...video.video.subtitle,
            style: {
              ...video.video.subtitle.style,
              ...newStyleProps.style
            }
          }
        }
      };
      console.log('updatedVideo', updatedVideo)
      updateVideo(updatedVideo);
    }
  };

  const onExportVideo = async () => {
    const cost = calculateCredits(video?.video?.metadata.audio_duration || 30)
    await basicApiCall('/video/save', { video })
    const exportResult : IExport = await basicApiCall('/export/create', { videoId: video?.id, spaceId: video?.spaceId, creditCost: cost })
    await basicApiCall('/space/removeCredits', { spaceId: video?.spaceId, cost })
    return exportResult.id
  }

  const calculateCredits = (videoDurationInSeconds: number) => {
    // Round up to the nearest 15 seconds
    const roundedDuration = Math.ceil(videoDurationInSeconds / 15) * 15;
    
    // Calculate the number of credits based on the rounded duration
    const creditsNeeded = Math.max(0.5, Math.ceil((roundedDuration - 15) / 30) * 0.5);
    
    return creditsNeeded * 10;
  }

  const handleSilentSave = async () => {
    if (isDirty) {
      setIsSaving(true)
      //await basicApiCall('/video/save', { video })
      setIsDirty(false)
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleSilentSave()
    }, 20000) // 20 secondes

    return () => {
      clearInterval(autoSaveInterval)
    }
  }, [video, isDirty])

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true)
        const response = await basicApiGetCall<IVideo>(`/video/${id}`)
        console.log("response", response)
        setVideo(response)
      } catch (error) {
        console.error(error)
        toast({
          title: t('error.title'),
          description: t('error.description-loading'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchVideo()
    }
  }, [id])

  useEffect(() => {
    if (video?.video?.sequences && selectedSequenceIndex >= 0 && selectedSequenceIndex < video.video.sequences.length) {
      playerRef.current?.seekTo(video.video.sequences[selectedSequenceIndex].start * 60)
    }
  }, [selectedSequenceIndex])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024) // 1024px est la breakpoint lg de Tailwind
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  return (
    <>
    {isLoading && (
        <div className="fixed inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-lg font-medium">{t('loading-video-data')}</p>
          </div>
        </div>
    )}
    <ModalConfirmExport
      cost={calculateCredits(video?.video?.metadata.audio_duration || 30)}
      isOpen={showModalExport}
      setIsOpen={setShowModalExport}
      onExportVideo={onExportVideo}
    />
    <div className="min-h-screen bg-muted overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-muted p-4">
        <div className="mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard" asChild>
                          <Link href="/dashboard">
                              Dashboard
                          </Link>
                      </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator/>
                    <BreadcrumbItem>
                        <BreadcrumbPage>{video?.title || 'Chargement...'}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-2">
            {isDirty ? (
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
            ) : (
                <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
            <span className='text-sm text-muted-foreground'>{isDirty ? 'Unsaved' : 'Saved'}</span>
            <Button variant="outline" size="icon" onClick={handleSaveVideo}>
                {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Save className="w-4 h-4" />
                )}
            </Button>
            <Button onClick={() => setShowModalExport(true)}>
                <Download className="w-4 h-4" />
                {t('export-button')}
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:block mx-auto px-4">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="min-h-[calc(100vh-5rem)] space-x-1"
        >
          <ResizablePanel defaultSize={30} minSize={20}>
            <Card className="h-full">
              <div className="flex flex-col h-[calc(100vh-5rem)] mt-2 mx-2">
                <Tabs defaultValue="sequences" className="w-full" onValueChange={setActiveTab1}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sequences" className="flex items-center gap-2">
                            <ListVideo className="w-4 h-4" />
                            Sequences
                        </TabsTrigger>
                        <TabsTrigger value="subtitle" className="flex items-center gap-2">
                            <SubtitlesIcon className="w-4 h-4" />
                            Subtitles
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="sequences">
                      <Panel1 
                        sequences={video?.video?.sequences || []} 
                        selectedSequenceIndex={selectedSequenceIndex} 
                        setSelectedSequenceIndex={setSelectedSequenceIndex} 
                        handleWordInputChange={handleWordInputChange} 
                        handleCutSequence={handleCutSequence} 
                      />
                    </TabsContent>
                    <TabsContent value="subtitle">
                      <Subtitles video={video} setSubtitleStyle={setSubtitleStyle} />
                    </TabsContent>
                </Tabs>
              </div>
            </Card>
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-transparent" />
          <ResizablePanel defaultSize={30} minSize={20}>
            <Card className="h-full">
              {activeTab1 === 'subtitle' ? (
                <ScrollArea className="h-[calc(100vh-5rem)]">
                  <SubtitleSettings video={video} updateSubtitleStyle={updateSubtitleStyle} />
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[calc(100vh-5rem)]">
                  {video?.video?.sequences && video?.video?.sequences[selectedSequenceIndex] && (
                  <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={video.spaceId} />
                  )}
                </ScrollArea>
              )}
            </Card>
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-transparent" />
          <ResizablePanel defaultSize={20} minSize={10}>
            <Card className="h-full">
              {!isMobile && <VideoPreview playerRef={playerRef} video={video} isMobile={isMobile} />}
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden px-4">
        <div
          ref={previewRef}
          className={`sticky top-[57px] z-20 transition-all duration-300 h-52`}
        >
          {isMobile && <VideoPreview playerRef={playerRef} video={video} isMobile={isMobile} />}
        </div>
        <Card className="mt-4">
          <Tabs value={activeTabMobile} onValueChange={setActiveTabMobile}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sequences">Séquences</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>
            <TabsContent value="sequences">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {video?.video?.sequences && video?.video?.sequences.map((sequence, index) => (
                  <Sequence 
                    key={index}
                    sequence={sequence} 
                    index={index} 
                    selectedIndex={selectedSequenceIndex} 
                    setSelectedIndex={setSelectedSequenceIndex} 
                    handleWordInputChange={handleWordInputChange} 
                    onCutSequence={handleCutSequence} 
                  />
                ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {video?.video?.sequences && video?.video?.sequences[selectedSequenceIndex] && (
                  <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={video.spaceId} />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
    </>
  )
}