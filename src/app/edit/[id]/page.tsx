'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayerRef } from '@remotion/player'
import { Button } from "@/src/components/ui/button"
import { Card } from "@/src/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/src/components/ui/breadcrumb"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/src/components/ui/resizable"
import { Download, Save, Loader2, ListVideo, Subtitles as SubtitlesIcon, Volume2 } from 'lucide-react'
import Link from 'next/link'
import SequenceSettings from '@/src/components/edit/sequence-settings'
import VideoPreview from '@/src/components/edit/video-preview'
import { useParams } from 'next/navigation'
import { basicApiCall, basicApiGetCall } from '@/src/lib/api'
import { ISequence, IVideo, IWord } from '@/src/types/video'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { IMedia } from '@/src/types/video'
import ModalConfirmExport from '@/src/components/modal/confirm-export'
import { IExport } from '@/src/types/export'
import { useToast } from '@/src/hooks/use-toast'
import Subtitles from '@/src/components/edit/subtitles'
import SubtitleSettings from '@/src/components/edit/subtitle-settings'
import { ISpaceSubtitleStyle } from '@/src/types/space'
import { useSubtitleStyleStore } from '@/src/store/subtitlesStyleSore'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import AudioSettings from '@/src/components/edit/audio-settings'
import Musics from '@/src/components/edit/musics'
import ModalPricing from '@/src/components/modal/modal-pricing'
import Sequences from '@/src/components/edit/sequences'
import { regenerateAudioForSequence, updateVideoTimings, waitForTranscription } from '@/src/lib/audio'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { CommandShortcut } from '@/src/components/ui/command'
import { ISpace } from '@/src/types/space'
import { PlanName } from '@/src/types/enums'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'

export default function VideoEditor() {
  const { id } = useParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const t = useTranslations('edit')

  const { setSubtitleStyles } = useSubtitleStyleStore()
  const { lastUsedParameters, setLastUsedParameters } = useActiveSpaceStore()

  const [video, setVideo] = useState<IVideo | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('loading-video-data')
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0)
  const [activeTabMobile, setActiveTabMobile] = useState('sequences')
  const [activeTab1, setActiveTab1] = useState('sequences')
  const [showWatermark, setShowWatermark] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showModalExport, setShowModalExport] = useState(false)
  const [showModalPricing, setShowModalPricing] = useState(false)
  const [modalPricingTitle, setModalPricingTitle] = useState('')
  const [modalPricingDescription, setModalPricingDescription] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  
  const updateVideo = (newVideoData: any) => {
    setVideo(newVideoData)
    setIsDirty(true)
  }

  const handleWordInputChange = (sequenceIndex: number, wordIndex: number, newWord: string) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences];
      const sequence = newSequences[sequenceIndex];
      
      // Mettre à jour le mot
      sequence.words[wordIndex].word = newWord;
      
      // Reconstruire le texte complet
      const newText = sequence.words.map(word => word.word).join(' ');
      sequence.text = newText;
      
      // Vérifier si le texte est différent de l'original
      const needsRegeneration = newText !== sequence.originalText;
      sequence.needsAudioRegeneration = needsRegeneration;
      
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });
    }
  };

  const handleCutSequence = (cutIndex: number) => {
    console.log("cutIndex", cutIndex)
  }

  const handleSaveVideo = async () => {
    setIsSaving(true);
    
    try {

      await basicApiCall('/video/save', { video });
      
      setIsDirty(false);
      
      toast({
        title: t('toast.title-saved'),
        description: t('toast.description-saved'),
        variant: 'confirm',
      });
    } catch (error) {
      toast({
        title: t('toast.title-error'),
        description: t('toast.description-save-error'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubtitleStyle = async () => {
    try {
      const subtitleStyle : ISpaceSubtitleStyle[] = await basicApiCall("/space/addSubtitleStyle", { spaceId: video?.spaceId || '', subtitleStyle: video?.video?.subtitle?.style })
      setSubtitleStyles(subtitleStyle)
      toast({
        title: t('toast.title-subtitle-saved'),
        description: t('toast.description-subtitle-saved'),
        variant: 'confirm',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t('toast.title-error'),
        description: t('toast.description-subtitle-error'),
        variant: 'destructive'
      })
    }
  }

  const setSequenceMedia = (sequenceIndex: number, media: IMedia) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences]
      newSequences[sequenceIndex].media = {
        ...newSequences[sequenceIndex].media,
        ...media,
      };
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
      updateVideo(updatedVideo);
    }
  };

  const updateAudioSettings = (audioSettings: any) => {
    if (video && video.video) {
      const updatedVideo = {
        ...video,
        video: {
          ...video.video,
          audio: audioSettings
        }
      };
      updateVideo(updatedVideo);
    }
  };

  const onExportVideo = async () => {
    await basicApiCall('/video/save', { video })
    try {
      const exportResult : IExport = await basicApiCall('/export/create', { videoId: video?.id, spaceId: video?.spaceId })
      return exportResult.id
    } catch (error : any) {
      console.error(error)
      setModalPricingTitle(t('modal-pricing-not-enough-credits'))
      setModalPricingDescription(t('modal-pricing-description-not-enough-credits'))
      setShowModalPricing(true)
      toast({
        title: t('toast.title-error'),
        description: t(`toast.description-${error.message}`),
        variant: 'destructive'
      })
      return undefined
    }
  }

  const calculateCredits = (videoDurationInSeconds: number) => {
    // Round up to the nearest 15 seconds
    const roundedDuration = Math.ceil(videoDurationInSeconds / 15) * 15;
    
    // Calculate the number of credits based on the rounded duration
    const creditsNeeded = Math.max(0.5, Math.ceil((roundedDuration - 15) / 30) * 0.5);
    
    return creditsNeeded * 10;
  }

  const handleSilentSave = async () => {
    if (isDirty && process.env.NODE_ENV !== 'development' && (session?.user?.email !== 'alan@hoox.video' && session?.user?.email !== 'maxime@hoox.video')) {
      setIsSaving(true)
      await basicApiCall('/video/save', { video })
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
        setIsLoading(true);
        const response = await basicApiGetCall<IVideo>(`/video/${id}`);

        if (response.video?.sequences) {
          response.video.sequences = response.video.sequences.map(seq => ({
            ...seq,
            originalText: seq.text,
            needsAudioRegeneration: false
          }));
        }
        
        setVideo(response);
        setIsLoading(false);

        const spaceResponse = await basicApiGetCall<ISpace>(`/space/${response.spaceId}`);
        setShowWatermark(spaceResponse.plan.name === PlanName.FREE);
        setSubtitleStyles(spaceResponse.subtitleStyle)

        setVideo(response)

      } catch (error) {
        console.error(error)
        toast({
          title: t('error.title'),
          description: t('error.description-loading'),
          variant: 'destructive'
        })
      }
    };

    if (id) {
      fetchVideo();
    }
  }, [id]);

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

  const handleRegenerateAudio = async (sequenceIndex: number) => {
    if (!video?.video) return;

    setLoadingMessage('loading-regenerating-audio')
    setIsLoading(true);

    try {
      const { audioUrl, transcriptionId } = await regenerateAudioForSequence(video, sequenceIndex);
      const audioIndex = video.video.sequences[sequenceIndex].audioIndex;
      const transcription = await waitForTranscription(transcriptionId);

      //const audioUrl = "https://media.hoox.video/843f1d10-4866-4a0b-954e-7de347d826ba.mp3"
      //const transcription = transcriptionMockup

      let updatedVideo = updateVideoTimings(video, audioIndex, audioUrl, transcription);

      updateVideo(updatedVideo);
      
      toast({
        title: t('toast.title-regenerated'),
        description: t('toast.description-regenerated'),
        variant: 'confirm'
      });
    } catch (error) {
      console.error('Error regenerating audio:', error);
      toast({
        title: t('toast.title-error'),
        description: t('toast.description-regeneration-error'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordDelete = (sequenceIndex: number, wordIndex: number) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences];
      const sequence = newSequences[sequenceIndex];
      
      const wordToDelete = sequence.words[wordIndex];
      const durationToAdd = wordToDelete.durationInFrames;
      
      if (wordIndex > 0) {
        sequence.words[wordIndex - 1].durationInFrames += durationToAdd;
      } else if (wordIndex < sequence.words.length - 1) {
        sequence.words[wordIndex + 1].durationInFrames += durationToAdd;
      }

      sequence.words.splice(wordIndex, 1);

      const newText = sequence.words.map(word => word.word).join(' ');
      sequence.text = newText;

      if (newText === sequence.originalText) {
        sequence.needsAudioRegeneration = false;
      } else {
        sequence.needsAudioRegeneration = true;
      }
      
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });
    }
  };

  const handleWordAdd = (sequenceIndex: number, wordIndex: number) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences];
      const sequence = newSequences[sequenceIndex];
      const previousWord = sequence.words[wordIndex];
      
      const halfDurationInFrames = Math.floor(previousWord.durationInFrames / 2);
      const halfDuration = (previousWord.end - previousWord.start) / 2;

      previousWord.durationInFrames = halfDurationInFrames;
      previousWord.end = halfDuration + previousWord.start;

      const newWord : IWord = {
        word: ' ',
        start: halfDuration + previousWord.start,
        durationInFrames: halfDurationInFrames,
        confidence: 1,
        end: previousWord.end
      };

      sequence.words.splice(wordIndex + 1, 0, newWord);

      const newText = sequence.words.map(word => word.word).join(' ');
      sequence.text = newText;

      sequence.needsAudioRegeneration = true;
      
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });
      
      return wordIndex + 1;
    }
    return -1;
  };

  const handleDeleteSequence = (sequenceIndex: number) => {
    if (!video?.video) return;

    const sequence = video.video.sequences[sequenceIndex];
    const audioIndex = sequence.audioIndex;
    const newSequences = [...video.video.sequences];
    
    // Trouver toutes les séquences avec le même audioIndex
    const sequencesWithSameAudio = newSequences.filter(seq => seq.audioIndex === audioIndex);
    const isFirst = sequencesWithSameAudio[0] === sequence;
    const isLast = sequencesWithSameAudio[sequencesWithSameAudio.length - 1] === sequence;
    const isAlone = sequencesWithSameAudio.length === 1;
    
    if (!video.video.audio) return;

    const newAudio = [...video.video.audio.voices];
    const audioArrayIndex = newAudio.findIndex(audio => audio.index === audioIndex);
    const audioToUpdate = newAudio[audioArrayIndex];
    
    if (isLast) {
        // Réduire la durée de l'audio
        audioToUpdate.durationInFrames -= sequence.durationInFrames || 0;
    }
    
    if (isFirst) {
        // Ajuster le startOffset et la durée
        audioToUpdate.startOffset = (audioToUpdate.startOffset || 0) + (sequence.durationInFrames || 0);
        audioToUpdate.durationInFrames -= sequence.durationInFrames || 0;
    }

    if (isAlone) {
        // Trouver l'index de l'audio à supprimer en utilisant audioIndex
        const audioArrayIndex = newAudio.findIndex(audio => audio.index === audioIndex);
        if (audioArrayIndex !== -1) {
            newAudio.splice(audioArrayIndex, 1);
        }
    }
    
    // Calculer la durée de la séquence à supprimer
    const sequenceDuration = sequence.end - sequence.start;
    
    // Supprimer la séquence
    newSequences.splice(sequenceIndex, 1);
    
    // Ajuster les timings de toutes les séquences suivantes
    for (let i = sequenceIndex; i < newSequences.length; i++) {
        const currentSequence = newSequences[i];
        
        // Ajuster les timings de la séquence
        currentSequence.start -= sequenceDuration;
        currentSequence.end -= sequenceDuration;
        
        // Ajuster les timings de chaque mot
        currentSequence.words = currentSequence.words.map(word => ({
            ...word,
            start: word.start - sequenceDuration,
            end: word.end - sequenceDuration
        }));
    }
    
    // Calculer la nouvelle durée audio totale
    const newAudioDuration = (video.video.metadata.audio_duration || 0) - sequenceDuration;
    
    // Mettre à jour le state
    updateVideo({
        ...video,
        video: {
            ...video.video,
            sequences: newSequences,
            audio: {
                ...video.video.audio,
                voices: newAudio
            },
            metadata: {
                ...video.video.metadata,
                audio_duration: newAudioDuration
            }
        }
    });
    
    // Mettre à jour l'index sélectionné si nécessaire
    if (selectedSequenceIndex >= sequenceIndex) {
        setSelectedSequenceIndex(Math.max(0, selectedSequenceIndex - 1));
    }
  };

  const handleAddSequence = (afterIndex: number) => {
    if (!video?.video) return;

    const newSequences = [...video.video.sequences];
    const previousSequence = newSequences[afterIndex];
    const defaultDuration = 3;
    const defaultDurationInFrames = defaultDuration * 60;

    // Gérer les voix
    let lastVoiceIndex = 0;
    if (video.video.audio?.voices) {
      const newVoices = [...video.video.audio.voices];
      const previousVoice = newVoices[previousSequence.audioIndex];
      lastVoiceIndex = Math.max(...newVoices.map(voice => voice.index)) + 1;

      // Créer la nouvelle voix
      const newVoice = {
        url: "", // URL vide car pas encore générée
        voiceId: previousVoice.voiceId,
        index: lastVoiceIndex, // Utiliser l'index suivant le dernier
        startOffset: 0,
        start: previousVoice.end,
        end: previousVoice.end + defaultDuration,
        durationInFrames: defaultDurationInFrames
      };

      // Trouver l'index dans la liste des voix qui correspond à l'index de la séquence précédente
      const indexBefore = newVoices.findIndex(voice => voice.index === previousSequence.audioIndex);
      // Insérer la nouvelle voix après la voix précédente
      newVoices.splice(indexBefore + 1, 0, newVoice);

      // Mettre à jour les timings des voix suivantes
      for (let i = previousSequence.audioIndex + 2; i < newVoices.length; i++) {
        const voice = newVoices[i];
        voice.start += defaultDuration;
        voice.end += defaultDuration;
      }

      // Mettre à jour la durée audio totale
      const newAudioDuration = (video.video.metadata.audio_duration || 0) + defaultDuration;

      // Créer la nouvelle séquence
      const newSequence: ISequence = {
        words: [{
          word: "Texte",
          start: previousSequence.end,
          end: previousSequence.end + defaultDuration,
          confidence: 1,
          durationInFrames: defaultDurationInFrames
        }],
        text: "Texte",
        originalText: "Texte",
        start: previousSequence.end,
        end: previousSequence.end + defaultDuration,
        durationInFrames: defaultDurationInFrames,
        audioIndex: lastVoiceIndex,
        needsAudioRegeneration: true
      };

      // Insérer la nouvelle séquence
      newSequences.splice(afterIndex + 1, 0, newSequence);

      // Mettre à jour les timings des séquences suivantes
      for (let i = afterIndex + 2; i < newSequences.length; i++) {
        const sequence = newSequences[i];
        sequence.start += defaultDuration;
        sequence.end += defaultDuration;
        sequence.words = sequence.words.map(word => ({
          ...word,
          start: word.start + defaultDuration,
          end: word.end + defaultDuration
        }));
      }

      // Mettre à jour le state avec les nouvelles voix
      updateVideo({
        ...video,
        video: {
          ...video.video,
          sequences: newSequences,
          audio: {
            ...video.video.audio,
            voices: newVoices
          },
          metadata: {
            ...video.video.metadata,
            audio_duration: newAudioDuration
          }
        }
      });
    } else {
      // Fallback si pas de voix (cas improbable)
      updateVideo({
        ...video,
        video: {
          ...video.video,
          sequences: newSequences,
          metadata: {
            ...video.video.metadata,
            audio_duration: (video.video.metadata.audio_duration || 0) + defaultDuration
          }
        }
      });
    }

    // Sélectionner la nouvelle séquence
    setSelectedSequenceIndex(afterIndex + 1);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Empêche le comportement par défaut du navigateur
        handleSaveVideo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDirty]); // Dépendances pour le useEffect

  return (
    <>
    {isLoading && (
        <div className="fixed inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-lg font-medium">{t(loadingMessage)}</p>
          </div>
        </div>
    )}
    <ModalPricing
      title={modalPricingTitle}
      description={modalPricingDescription}
      isOpen={showModalPricing}
      setIsOpen={setShowModalPricing}
    />
    <ModalConfirmExport
      cost={calculateCredits(video?.video?.metadata.audio_duration || 30)}
      isOpen={showModalExport}
      spaceId={video?.spaceId || ''}
      setIsOpen={setShowModalExport}
      onExportVideo={onExportVideo}
      showWatermark={showWatermark}
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
          <Link href="/dashboard" className="hidden sm:block">
            <Image
              src="/img/logo_little.png"
              alt="Logo"
              width={70}
              height={20}
              className="w-auto h-auto"
              priority
            />
          </Link>
          <div className="flex items-center space-x-2">
            {isDirty ? (
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
            ) : (
                <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
            <div className="hidden sm:flex items-center space-x-2">
              <span className='text-sm text-muted-foreground'>{isDirty ? t('unsaved') : t('saved')}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleSaveVideo}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <p>{t('save')}</p>
                    <CommandShortcut>⌘S</CommandShortcut>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="sequences" className="flex items-center gap-2">
                            <ListVideo className="w-4 h-4" />
                            {t('sequences-tabs-title')}
                        </TabsTrigger>
                        <TabsTrigger value="subtitle" className="flex items-center gap-2">
                            <SubtitlesIcon className="w-4 h-4" />
                            {t('subtitles-tabs-title')}
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            {t('audio-tabs-title')}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="sequences">
                      <Sequences 
                        sequences={video?.video?.sequences || []} 
                        selectedSequenceIndex={selectedSequenceIndex} 
                        setSelectedSequenceIndex={setSelectedSequenceIndex} 
                        handleWordInputChange={handleWordInputChange} 
                        handleWordAdd={handleWordAdd}
                        handleWordDelete={handleWordDelete}
                        handleCutSequence={handleCutSequence}
                        onRegenerateAudio={handleRegenerateAudio}
                        onDeleteSequence={handleDeleteSequence}
                        onAddSequence={handleAddSequence}
                        playerRef={playerRef}
                      />
                    </TabsContent>
                    <TabsContent value="subtitle">
                      <Subtitles video={video} setSubtitleStyle={setSubtitleStyle} />
                    </TabsContent>
                    <TabsContent value="audio">
                      <Musics video={video} updateAudioSettings={updateAudioSettings} />
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
                  <SubtitleSettings video={video} updateSubtitleStyle={updateSubtitleStyle} handleSaveSubtitleStyle={handleSaveSubtitleStyle} />
                </ScrollArea>
              ) : activeTab1 === 'audio' ? (
                <ScrollArea className="h-[calc(100vh-5rem)]">
                  <AudioSettings video={video} updateAudioSettings={updateAudioSettings} />
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[calc(100vh-5rem)]">
                  {video?.video?.sequences && video?.video?.sequences[selectedSequenceIndex] && (
                    <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={video.spaceId} hadAvatar={video.video.avatar ? true : false} />
                  )}
                </ScrollArea>
              )}
            </Card>
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-transparent" />
          <ResizablePanel defaultSize={20} minSize={10}>
            <Card className="h-full">
              {!isMobile && <VideoPreview playerRef={playerRef} video={video} isMobile={isMobile} showWatermark={showWatermark} />}
          </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden px-4">
        <div
          ref={previewRef}
          className={`sticky top-[57px] z-20 transition-all duration-300 h-96`}
        >
          {isMobile && <VideoPreview playerRef={playerRef} video={video} isMobile={isMobile} showWatermark={showWatermark} />}
        </div>
        <Card className="mt-4">
          <Tabs value={activeTabMobile} onValueChange={setActiveTabMobile}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sequences" className="flex items-center gap-2">
                    <ListVideo className="w-4 h-4" />
                    {t('sequences-tabs-title')}
                </TabsTrigger>
                <TabsTrigger value="subtitle" className="flex items-center gap-2">
                    <SubtitlesIcon className="w-4 h-4" />
                    {t('subtitles-tabs-title')}
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    {t('audio-tabs-title')}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="sequences">
              <Sequences 
                sequences={video?.video?.sequences || []} 
                selectedSequenceIndex={selectedSequenceIndex} 
                setSelectedSequenceIndex={setSelectedSequenceIndex} 
                handleWordInputChange={handleWordInputChange} 
                handleWordAdd={handleWordAdd}
                handleWordDelete={handleWordDelete}
                handleCutSequence={handleCutSequence}
                onRegenerateAudio={handleRegenerateAudio}
                onDeleteSequence={handleDeleteSequence}
                onAddSequence={handleAddSequence}
                playerRef={playerRef}
              />
            </TabsContent>
            <TabsContent value="subtitle">
              <ScrollArea className="h-[calc(100vh-25rem)] mx-2">
                <Subtitles video={video} setSubtitleStyle={setSubtitleStyle} setActiveTabMobile={setActiveTabMobile} isMobile={isMobile} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="audio">
              <ScrollArea className="h-[calc(100vh-25rem)] mx-2 overflow-visible">
                <Musics video={video} updateAudioSettings={updateAudioSettings} isMobile={isMobile} setActiveTabMobile={setActiveTabMobile} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings-sequence">
              <ScrollArea className="h-[calc(100vh-25rem)] mx-2">
                {video?.video?.sequences && video?.video?.sequences[selectedSequenceIndex] && (
                  <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={video.spaceId} hadAvatar={video.video.avatar ? true : false} />
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings-subtitle">
              <ScrollArea className="h-[calc(100vh-25rem)]">
                <SubtitleSettings video={video} updateSubtitleStyle={updateSubtitleStyle} handleSaveSubtitleStyle={handleSaveSubtitleStyle} isMobile={isMobile} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings-audio">
              <ScrollArea className="h-[calc(100vh-25rem)]">
                <AudioSettings video={video} updateAudioSettings={updateAudioSettings} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
    </>
  )
}