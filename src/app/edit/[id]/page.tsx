'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayerRef } from '@remotion/player'
import { Button } from "@/src/components/ui/button"
import { Card } from "@/src/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/src/components/ui/breadcrumb"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/src/components/ui/resizable"
import { Download, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Sequence from '@/src/components/edit/sequence'
import SequenceSettings from '@/src/components/edit/sequence-settings'
import VideoPreview from '@/src/components/edit/video-preview'
import { useParams } from 'next/navigation'
import { basicApiGetCall } from '@/src/lib/api'
import { IVideo } from '@/src/types/video'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { IMedia } from '@/src/types/video'

export default function VideoEditor() {
  const { id } = useParams()
  const t = useTranslations('edit')

  const [video, setVideo] = useState<IVideo | null>(null)
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0)
  const [activeTab, setActiveTab] = useState('sequences')
  const previewRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const handleWordInputChange = (wordIndex: number, newWord: string) => {
    console.log("wordIndex", wordIndex, "newWord", newWord)
  }

  const handleCutSequence = (cutIndex: number) => {
    console.log("cutIndex", cutIndex)
  }

  const setSequenceMedia = (sequenceIndex: number, media: IMedia) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences]
      newSequences[sequenceIndex].media = media
      setVideo({ ...video, video: { ...video.video, sequences: newSequences } })
    }
  }

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true)
        const response = await basicApiGetCall<IVideo>(`/video/${id}`)
        console.log("response", response)
        setVideo(response)
      } catch (error) {
        console.error('Erreur lors de la récupération de la vidéo:', error)
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
            <Button variant="outline" size="icon">
                <Save className="w-4 h-4" />
            </Button>
            <Button>
                <Download className="w-4 h-4" />
                Exporter
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
                <ScrollArea className="h-[calc(100vh-5rem)]">
                    {video?.video?.sequences && video?.video?.sequences.map((sequence, index) => (
                        <Sequence sequence={sequence} index={index} selectedIndex={selectedSequenceIndex} setSelectedIndex={setSelectedSequenceIndex} handleWordInputChange={handleWordInputChange} onCutSequence={handleCutSequence} />
                    ))}
                </ScrollArea>
            </Card>
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-transparent" />
          <ResizablePanel defaultSize={30} minSize={20}>
            <Card className="h-full">
              <ScrollArea className="h-[calc(100vh-5rem)]">
                {video?.video?.sequences && video?.video?.sequences[selectedSequenceIndex] && (
                  <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} />
                )}
              </ScrollArea>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sequences">Séquences</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>
            <TabsContent value="sequences">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {video?.video?.sequences && video?.video?.sequences.map((sequence, index) => (
                  <Sequence 
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
                  <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} />
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