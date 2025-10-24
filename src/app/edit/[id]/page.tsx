'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayerRef } from '@remotion/player'
import { Button } from "@/src/components/ui/button"
import { Card } from "@/src/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/src/components/ui/breadcrumb"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/src/components/ui/resizable"
import { Download, Save, Loader2, ListVideo, Subtitles as SubtitlesIcon, Volume2, Rocket, Settings } from 'lucide-react'
import Link from 'next/link'
import SequenceSettings from '@/src/components/edit/sequence-settings'
import VideoPreview from '@/src/components/edit/video-preview'
import { useParams } from 'next/navigation'
import { basicApiCall, basicApiGetCall } from '@/src/lib/api'
import { ISequence, IVideo, IWord, ITransition, VideoFormat, ZoomType, IElement } from '@/src/types/video'
import { AvatarLook } from '@/src/types/avatar'
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
import { getTranscription, regenerateAudioForSequence, updateVideoTimings } from '@/src/lib/audio'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { CommandShortcut } from '@/src/components/ui/command'
import { ISpace } from '@/src/types/space'
import { PlanName } from '@/src/types/enums'
import TransitionSettings from '@/src/components/edit/transition-settings'
import { transitions as defaultTransitions, sounds as defaultSounds } from '@/src/config/transitions.config'
import { usePremiumToast } from '@/src/utils/premium-toast'
import MobileDisclaimerModal from '@/src/components/modal/mobile-disclaimer'
import { useAssetsStore } from '@/src/store/assetsStore'
import { useVideoFramesStore } from '@/src/store/videoFramesStore'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { LogoPosition } from '@/src/types/space'
import { useBrowserDetection } from '@/src/hooks/use-browser-detection'
import { calculateGenerationCredits } from '@/src/lib/video-estimation'
import { AvatarModel } from '@/src/components/ui/avatar-model-selector'

export default function VideoEditor() {
  const { id } = useParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const t = useTranslations('edit')
  const pricingT = useTranslations('pricing')
  const planT = useTranslations('plan')
  const exportModalT = useTranslations('export-modal')
  const { showPremiumToast } = usePremiumToast()
  const { isIOS, isMobile, isClient } = useBrowserDetection()

  const { setSubtitleStyles } = useSubtitleStyleStore()
  const assetsStore = useAssetsStore()
  const { clearOldFrames } = useVideoFramesStore()
  const { activeSpace: storeActiveSpace, setActiveSpaceFromISpace } = useActiveSpaceStore()

  const [video, setVideo] = useState<IVideo | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('loading-video-data')
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0)
  const [selectedTransitionIndex, setSelectedTransitionIndex] = useState<number>(-1)
  const [activeTabMobile, setActiveTabMobile] = useState('sequences')
  const [activeTab1, setActiveTab1] = useState('sequences')
  const [showWatermark, setShowWatermark] = useState(() => { return storeActiveSpace?.planName === PlanName.FREE; })
  const [planName, setPlanName] = useState<PlanName>(() => { return storeActiveSpace?.planName || PlanName.FREE; })
  const previewRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showModalExport, setShowModalExport] = useState(false)
  const [showModalPricing, setShowModalPricing] = useState(false)
  const [modalPricingTitle, setModalPricingTitle] = useState('')
  const [modalPricingDescription, setModalPricingDescription] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [hasExistingReview, setHasExistingReview] = useState(false)
  const [showMobileDisclaimer, setShowMobileDisclaimer] = useState(false)
  const [spaceCredits, setSpaceCredits] = useState<number | undefined>(() => { return storeActiveSpace?.credits; })
  const [originalLogoPosition, setOriginalLogoPosition] = useState<LogoPosition | null>(() => { return storeActiveSpace?.logo?.position || null; })
  const [originalLogoSize, setOriginalLogoSize] = useState<number | null>(() => { return storeActiveSpace?.logo?.size || null; })
  const [muteBackgroundMusic, setMuteBackgroundMusic] = useState(isIOS)
  
  // État local pour les données du logo initialisé avec le store si disponible
  const [logoData, setLogoData] = useState<{
    url: string;
    position: LogoPosition;
    show: boolean;
    size: number;
  } | undefined>(() => {
    // Initialiser avec les données du store si disponible
    const storeLogo = storeActiveSpace?.logo;
    if (storeLogo?.url && storeLogo?.position) {
      return {
        url: storeLogo.url,
        position: storeLogo.position,
        show: storeLogo.show ?? true,
        size: storeLogo.size ?? 100
      };
    }
    return undefined;
  })
  
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

  const handleWordCut = (sequenceIndex: number, wordIndex: number) => {
    if (!video?.video || wordIndex >= video.video.sequences[sequenceIndex].words.length - 1) {
      // Ne pas couper si c'est le dernier mot
      return;
    }

    const newSequences = [...video.video.sequences];
    const originalSequence = newSequences[sequenceIndex];

    const wordsToKeep = originalSequence.words.slice(0, wordIndex + 1);
    const wordsToMove = originalSequence.words.slice(wordIndex + 1);

    if (wordsToMove.length === 0) return;

    const durationOfWordsToMove = wordsToMove.reduce((total, word) => total + word.durationInFrames, 0);
    const timeOfWordsToMove = wordsToMove.reduce((total, word) => total + (word.end - word.start), 0);

    originalSequence.words = wordsToKeep;
    originalSequence.text = wordsToKeep.map(word => word.word).join(' ');
    originalSequence.originalText = originalSequence.text;
    originalSequence.needsAudioRegeneration = false;
    originalSequence.end = wordsToKeep[wordsToKeep.length - 1].end;
    originalSequence.durationInFrames = (originalSequence.durationInFrames || 0) - durationOfWordsToMove;

    const newSequenceStart = originalSequence.end;
    const newSequenceEnd = newSequenceStart + timeOfWordsToMove;
    
    const newSequence: ISequence = {
      words: wordsToMove.map(word => ({
        ...word,
      })),
      text: wordsToMove.map(word => word.word).join(' '),
      originalText: wordsToMove.map(word => word.word).join(' '),
      start: newSequenceStart,
      end: newSequenceEnd,
      durationInFrames: durationOfWordsToMove,
      audioIndex: originalSequence.audioIndex,
      needsAudioRegeneration: false,
      media: originalSequence.media ? { ...originalSequence.media } : undefined
    };

    newSequences.splice(sequenceIndex + 1, 0, newSequence);

    const newTransitions = [...(video.video.transitions || [])];
    newTransitions.forEach(transition => {
      if (transition.indexSequenceBefore !== undefined && transition.indexSequenceBefore > sequenceIndex) {
        transition.indexSequenceBefore += 1;
      }
    });

    updateVideo({
      ...video,
      video: {
        ...video.video,
        sequences: newSequences,
        transitions: newTransitions
      }
    });

    setSelectedSequenceIndex(sequenceIndex + 1);
  };

  const saveVideo = async (showToast: boolean = true) => {
    const savePromises = [basicApiCall('/video/save', { video })];
    
    // Vérifier si les données du logo ont changé et sauvegarder le space si nécessaire
    if (originalLogoPosition && logoData && 
        (originalLogoPosition.x !== logoData.position.x || 
         originalLogoPosition.y !== logoData.position.y ||
         originalLogoSize !== logoData.size)) {
      
      const spaceUpdateData = {
        logo: {
          ...logoData,
          position: logoData.position,
          size: logoData.size
        }
      };
      savePromises.push(basicApiCall(`/space/${video?.spaceId}`, spaceUpdateData));
    }
    
    await Promise.all(savePromises);
    
    // Mettre à jour les valeurs originales après sauvegarde
    if (logoData?.position) {
      setOriginalLogoPosition(logoData.position);
    }
    if (logoData?.size) {
      setOriginalLogoSize(logoData.size);
    }
    
    setIsDirty(false);
    
    if (showToast) {
      toast({
        title: t('toast.title-saved'),
        description: t('toast.description-saved'),
        variant: 'confirm',
      });
    }
  };

  const handleSaveVideo = async () => {
    setIsSaving(true);
    
    try {
      await saveVideo(true);
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
      // Vérifier si l'utilisateur a un plan Pro ou Entreprise
      if (planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE) {
        showPremiumToast(
          pricingT('premium-toast.title'),
          pricingT('premium-toast.description', { plan: planT(PlanName.PRO) }),
          pricingT('upgrade')
        );
        return;
      }

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
    setVideo(prevVideo => {
      if (!prevVideo?.video?.subtitle) return prevVideo;

      const updatedVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          subtitle: {
            ...prevVideo.video.subtitle,
            style: {
              ...prevVideo.video.subtitle.style,
              ...newStyleProps.style
            }
          }
        }
      };
      setIsDirty(true);
      return updatedVideo;
    });
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

  const onExportVideo = async (avatarModel?: AvatarModel) => {

    try {
      await basicApiCall('/video/save', { video })

      const exportResult : IExport = await basicApiCall('/export/create', { 
        videoId: video?.id, 
        spaceId: video?.spaceId,
        avatarModel 
      })
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



  const handleSilentSave = async () => {
    if (isDirty && process.env.NODE_ENV !== 'development' && (session?.user?.email !== 'alan@hoox.video' && session?.user?.email !== 'maxime@hoox.video')) {
      setIsSaving(true)
      
      try {
        await saveVideo(false);
      } catch (error) {
        console.error('Error during silent save:', error);
      } finally {
        setIsSaving(false)
      }
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

  // Nettoyer les vieilles frames du cache toutes les 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      clearOldFrames()
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(cleanupInterval)
    }
  }, [clearOldFrames])

  useEffect(() => {
    const fetchData = async () => {
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
        setSubtitleStyles(spaceResponse.subtitleStyle);
        setPlanName(spaceResponse.plan.name);
        setSpaceCredits(spaceResponse.credits);

        if (response.spaceId && (spaceResponse as any).medias && Array.isArray((spaceResponse as any).medias)) {
          assetsStore.setAssets(response.spaceId, (spaceResponse as any).medias);
        }

        // Initialiser les données du logo localement si pas déjà initialisées depuis le store
        if (spaceResponse.logo && spaceResponse.logo.url && spaceResponse.logo.position) {
          if (!logoData) {
            setLogoData({
              url: spaceResponse.logo.url,
              position: spaceResponse.logo.position,
              show: spaceResponse.logo.show ?? true,
              size: spaceResponse.logo.size ?? 100
            });
          }
          if (!originalLogoPosition) {
            setOriginalLogoPosition(spaceResponse.logo.position);
          }
          if (!originalLogoSize) {
            setOriginalLogoSize(spaceResponse.logo.size ?? 100);
          }
        }
        
        // Vérifier si une review existe déjà
        const reviewResponse = await basicApiGetCall(`/reviews/${id}`);
        setHasExistingReview(!!reviewResponse);

        // Si aucun espace actif n'est défini dans le store, on le définit à partir de la réponse complète
        if (!storeActiveSpace) {
          setActiveSpaceFromISpace(spaceResponse)
        }

      } catch (error) {
        console.error(error);
        toast({
          title: t('error.title'),
          description: t('error.description-loading'),
          variant: 'destructive'
        });
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (video?.video?.sequences && selectedSequenceIndex >= 0 && selectedSequenceIndex < video.video.sequences.length) {
      playerRef.current?.seekTo(video.video.sequences[selectedSequenceIndex].start * 60)
    }

    if (video?.video?.transitions && selectedTransitionIndex >= 0 && selectedTransitionIndex < video.video.transitions.length) {
      const transitionIndex = video.video.transitions[selectedTransitionIndex].indexSequenceBefore ?? 0;
      const sequenceBefore = video.video.sequences[transitionIndex];
      playerRef.current?.seekTo((sequenceBefore.end * 60) - (video.video.transitions[selectedTransitionIndex].fullAt ?? 0));
    }
  }, [selectedSequenceIndex, selectedTransitionIndex])

  useEffect(() => {
    setMuteBackgroundMusic(isIOS)
    // Check localStorage and mobile status to show disclaimer
    if (isClient && isMobile && !localStorage.getItem('mobileDisclaimerShown')) {
      setShowMobileDisclaimer(true);
    }
  }, [isMobile, isClient]);

  const handleCloseMobileDisclaimer = () => {
    setShowMobileDisclaimer(false);
    localStorage.setItem('mobileDisclaimerShown', 'true');
  };

  const handleRegenerateAudio = async (sequenceIndex: number) => {
    if (!video?.video) return;

    setLoadingMessage('loading-regenerating-audio')
    setIsLoading(true);

    try {
      const { audioUrl } = await regenerateAudioForSequence(video, sequenceIndex);
      const audioIndex = video.video.sequences[sequenceIndex].audioIndex;
      const transcription = await getTranscription(audioUrl);

      //const audioUrl = "https://media.hoox.video/843f1d10-4866-4a0b-954e-7de347d826ba.mp3"
      //const transcription = transcriptionMockup

      let updatedVideo = updateVideoTimings(video, audioIndex, audioUrl, transcription, sequenceIndex);

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
      const sequence = video.video.sequences[sequenceIndex];
      
      // Si la séquence n'a qu'un seul mot, supprimer la séquence entière
      if (sequence.words.length === 1) {
        handleDeleteSequence(sequenceIndex);
        return;
      }
      
      const newSequences = [...video.video.sequences];
      const sequenceToUpdate = newSequences[sequenceIndex];
      
      const wordToDelete = sequenceToUpdate.words[wordIndex];
      const durationToAdd = wordToDelete.durationInFrames;
      
      if (wordIndex > 0) {
        sequenceToUpdate.words[wordIndex - 1].durationInFrames += durationToAdd;
      } else if (wordIndex < sequenceToUpdate.words.length - 1) {
        sequenceToUpdate.words[wordIndex + 1].durationInFrames += durationToAdd;
      }

      sequenceToUpdate.words.splice(wordIndex, 1);

      const newText = sequenceToUpdate.words.map(word => word.word).join(' ');
      sequenceToUpdate.text = newText;

      if (newText === sequenceToUpdate.originalText) {
        sequenceToUpdate.needsAudioRegeneration = false;
      } else {
        sequenceToUpdate.needsAudioRegeneration = true;
      }
      
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });
    }
  };

  const handleMergeWordWithPrevious = (sequenceIndex: number, wordIndex: number) => {
    if (!video?.video || sequenceIndex <= 0 || wordIndex !== 0) return;
    
    const newSequences = [...video.video.sequences];
    const currentSequence = newSequences[sequenceIndex];
    const previousSequence = newSequences[sequenceIndex - 1];
    
    // The word to move
    const wordToMove = currentSequence.words[0];
    
    // Add the word to the end of the previous sequence
    previousSequence.words.push(wordToMove);
    
    // Update the timing of the previous sequence
    previousSequence.end = wordToMove.end;
    previousSequence.durationInFrames = (previousSequence.durationInFrames || 0) + wordToMove.durationInFrames;
    
    // Update the text of the previous sequence
    previousSequence.text = previousSequence.words.map(word => word.word).join(' ');
    previousSequence.originalText = previousSequence.text;
    previousSequence.needsAudioRegeneration = false;
    
    // Delete the word from the current sequence
    currentSequence.words.splice(0, 1);
    
    // Update the timing of the current sequence
    currentSequence.start = wordToMove.end;
    currentSequence.durationInFrames = (currentSequence.durationInFrames || 0) - wordToMove.durationInFrames;
    
    // Update the text of the current sequence
    currentSequence.text = currentSequence.words.map(word => word.word).join(' ');
    currentSequence.originalText = currentSequence.text;
    currentSequence.needsAudioRegeneration = false;
    
    updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });
    if (currentSequence.words.length === 0) {
      // If the sequence becomes empty, delete it
      handleDeleteSequence(sequenceIndex);
    }
  };

  const handleMergeWordWithNext = (sequenceIndex: number, wordIndex: number) => {
    if (!video?.video || sequenceIndex >= video.video.sequences.length - 1) return;
    
    const newSequences = [...video.video.sequences];
    const currentSequence = newSequences[sequenceIndex];
    const nextSequence = newSequences[sequenceIndex + 1];
    
    // Check if the word to move is the last one of the current sequence
    if (wordIndex !== currentSequence.words.length - 1) return;
    
    // The word to move
    const wordToMove = currentSequence.words[wordIndex];
    
    // Add the word to the beginning of the next sequence
    nextSequence.words.unshift(wordToMove);
    
    // Update the timing of the next sequence
    nextSequence.start = wordToMove.start;
    nextSequence.durationInFrames = (nextSequence.durationInFrames || 0) + wordToMove.durationInFrames;
    
    // Update the text of the next sequence
    nextSequence.text = nextSequence.words.map(word => word.word).join(' ');
    nextSequence.originalText = nextSequence.text;
    nextSequence.needsAudioRegeneration = false;
    
    // Delete the word from the current sequence
    currentSequence.words.pop();
    
    // Update the timing of the current sequence
    currentSequence.end = wordToMove.start;
    currentSequence.durationInFrames = (currentSequence.durationInFrames || 0) - wordToMove.durationInFrames;
    
    // Update the text of the current sequence
    currentSequence.text = currentSequence.words.map(word => word.word).join(' ');
    currentSequence.originalText = currentSequence.text;
    currentSequence.needsAudioRegeneration = false;
    
    updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });
    if (currentSequence.words.length === 0) {
      // If the sequence becomes empty, delete it
      handleDeleteSequence(sequenceIndex);
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

  const handleWordZoomChange = (sequenceIndex: number, wordIndex: number, zoom: ZoomType | undefined) => {
    if (video && video.video) {
      const newSequences = [...video.video.sequences];
      const sequence = newSequences[sequenceIndex];
      const word = sequence.words[wordIndex];
      
      // Mettre à jour le zoom du mot
      sequence.words[wordIndex].zoom = zoom;
      
      updateVideo({ ...video, video: { ...video.video, sequences: newSequences } });

      // Prévisualiser le zoom si on en ajoute un
      if (zoom && playerRef.current) {
        // Configuration des durées de zoom (en frames à 60fps)
        const ZOOM_DURATIONS = {
          'zoom-in': 25,
          'zoom-in-impact': 10,
          'zoom-in-fast': 15,
          'zoom-in-instant': 0,
          'zoom-out': 25,
          'zoom-out-impact': 10,
          'zoom-out-fast': 15,
          'zoom-out-instant': 0,
          'zoom-in-continuous': 120, // 2 secondes pour prévisualisation
          'zoom-out-continuous': 120, // 2 secondes pour prévisualisation
        };

        // Aller au début du mot
        playerRef.current.seekTo(word.start * 60);
        
        // Attendre un petit délai pour que le seek soit effectif
        setTimeout(() => {
          if (playerRef.current) {
            // Lancer la lecture
            playerRef.current.play();
            
            // Calculer la durée de lecture (frames / 60fps = secondes)
            const durationInFrames = ZOOM_DURATIONS[zoom] || 25;
            const durationInMs = durationInFrames === 0 ? 500 : (durationInFrames / 60) * 1000; // 500ms pour les instants
            
            // Arrêter la lecture après la durée du zoom
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.pause();
              }
            }, durationInMs);
          }
        }, 100);
      }
    }
  };

  const handleDeleteSequence = (sequenceIndex: number) => {
    if (!video?.video) return;

    const newTransitions = [...(video.video.transitions || [])];

    // Mettre à jour les indexSequenceBefore des transitions
    newTransitions.forEach(transition => {
      if (transition.indexSequenceBefore !== undefined && transition.indexSequenceBefore >= sequenceIndex) {
        transition.indexSequenceBefore -= 1;
      }
    });

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
    
    // Calculer la durée de la séquence à supprimer
    const sequenceDuration = sequence.end - sequence.start;

    // Mettre à jour les start et end de tous les audios suivants
    for (let i = audioArrayIndex + 1; i < newAudio.length; i++) {
      newAudio[i].start -= sequenceDuration;
      newAudio[i].end -= sequenceDuration;
  }
    
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
    } else {
        audioToUpdate.end -= sequenceDuration;
    }
    
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
            transitions: newTransitions,
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

  const handleAddSequence = (index: number, before: boolean = false) => {
    if (!video?.video) return;

    const newSequences = [...video.video.sequences];
    const newTransitions = [...(video.video.transitions || [])];
    const defaultDuration = 3;
    const defaultDurationInFrames = defaultDuration * 60;
    
    // Helper function to check if a sequence is the last one with its audio index
    const isLastSequenceWithAudioIndex = (sequences: ISequence[], sequenceIndex: number): boolean => {
      const currentSequence = sequences[sequenceIndex];
      const audioIndex = currentSequence.audioIndex;
      
      const sequencesWithSameAudio = sequences.filter(seq => seq.audioIndex === audioIndex);
      return sequencesWithSameAudio[sequencesWithSameAudio.length - 1] === currentSequence;
    };

    const insertIndex = before ? index : index + 1;
    const referenceSequence = newSequences[index];
    const newSequenceStart = before ? 0 : referenceSequence.end;
    const newSequenceEnd = newSequenceStart + defaultDuration;
    const updateStartIndex = before ? 0 : insertIndex;

    const transitionThreshold = before ? index : index;
    newTransitions.forEach(transition => {
      if (transition.indexSequenceBefore !== undefined && 
          (before ? transition.indexSequenceBefore >= transitionThreshold : transition.indexSequenceBefore > transitionThreshold)) {
        transition.indexSequenceBefore += 1;
      }
    });

    if (video.video.audio?.voices) {
      const newVoices = [...video.video.audio.voices];
      const referenceVoice = newVoices.find(voice => voice.index === referenceSequence.audioIndex);

      if (!referenceVoice) return;
      
      const shouldCreateNewAudioIndex = before || isLastSequenceWithAudioIndex(newSequences, index);
      const newVoiceIndex = shouldCreateNewAudioIndex 
        ? Math.max(...newVoices.map(voice => voice.index)) + 1 
        : referenceSequence.audioIndex;

      let startUpdateIndex: number;

      if (shouldCreateNewAudioIndex) {
        const newVoice = {
          url: "",
          voiceId: referenceVoice.voiceId,
          index: newVoiceIndex,
          startOffset: 0,
          start: newSequenceStart,
          end: newSequenceEnd,
          durationInFrames: defaultDurationInFrames
        };

        if (before) {
          newVoices.unshift(newVoice);
          startUpdateIndex = 1;
        } else {
          const voiceIndex = newVoices.findIndex(voice => voice.index === referenceSequence.audioIndex);
          newVoices.splice(voiceIndex + 1, 0, newVoice);
          startUpdateIndex = newVoices.findIndex(v => v.index === newVoiceIndex) + 1;
        }
      } else {
        const existingVoiceIndex = newVoices.findIndex(voice => voice.index === referenceSequence.audioIndex);
        if (existingVoiceIndex !== -1) {
          newVoices[existingVoiceIndex].end += defaultDuration;
          newVoices[existingVoiceIndex].durationInFrames += defaultDurationInFrames;
          
          startUpdateIndex = existingVoiceIndex + 1;
        } else {
          startUpdateIndex = newVoices.length;
        }
      }

      for (let i = startUpdateIndex; i < newVoices.length; i++) {
        newVoices[i].start += defaultDuration;
        newVoices[i].end += defaultDuration;
      }

      const newSequence: ISequence = {
        words: [{
          word: "Texte",
          start: newSequenceStart,
          end: newSequenceEnd,
          confidence: 1,
          durationInFrames: defaultDurationInFrames
        }],
        text: "Texte",
        originalText: "Texte",
        start: newSequenceStart,
        end: newSequenceEnd,
        durationInFrames: defaultDurationInFrames,
        audioIndex: newVoiceIndex,
        needsAudioRegeneration: shouldCreateNewAudioIndex
      };

      newSequences.splice(insertIndex, 0, newSequence);

      for (let i = updateStartIndex === 0 ? 1 : insertIndex + 1; i < newSequences.length; i++) {
        if (i === insertIndex) continue; // Skip la nouvelle séquence
        newSequences[i].start += defaultDuration;
        newSequences[i].end += defaultDuration;
        newSequences[i].words = newSequences[i].words.map(word => ({
          ...word,
          start: word.start + defaultDuration,
          end: word.end + defaultDuration
        }));
      }

      updateVideo({
        ...video,
        video: {
          ...video.video,
          sequences: newSequences,
          transitions: newTransitions,
          audio: {
            ...video.video.audio,
            voices: newVoices
          },
          metadata: {
            ...video.video.metadata,
            audio_duration: (video.video.metadata.audio_duration || 0) + defaultDuration
          }
        }
      });
    }

    setSelectedSequenceIndex(before ? 0 : index + 1);
    setSelectedTransitionIndex(-1);
  };

  const handleDeleteTransition = (index: number) => {
    if (!video?.video?.transitions) return;

    const newTransitions = [...video.video.transitions];
    const transitionToDelete = newTransitions[index];
    const sequenceIndex = transitionToDelete.indexSequenceBefore ?? 0;
    
    newTransitions.splice(index, 1);

    updateVideo({
      ...video,
      video: {
        ...video.video,
        transitions: newTransitions
      }
    });
    
    setSelectedTransitionIndex(-1);
    setSelectedSequenceIndex(sequenceIndex + 1);
  };

  const handleUpdateDuration = (sequenceIndex: number, newDuration: number) => {
    if (!video?.video) return;

    const newSequences = [...video.video.sequences];
    const sequence = newSequences[sequenceIndex];
    const newEnd = sequence.start + newDuration;
    const timeDiff = newEnd - sequence.end;

    // Mettre à jour le end de la séquence
    sequence.end = newEnd;

    // Mettre à jour le end et la durationInFrames du dernier mot
    const lastWord = sequence.words[sequence.words.length - 1];
    const oldWordDurationInFrames = lastWord.durationInFrames;
    lastWord.end = newEnd;
    lastWord.durationInFrames = Math.round((lastWord.end - lastWord.start) * 60);
    
    // Calculer la différence de durationInFrames
    const durationInFramesDiff = lastWord.durationInFrames - oldWordDurationInFrames;
    
    // Mettre à jour la durationInFrames de la séquence
    sequence.durationInFrames = (sequence.durationInFrames || 0) + durationInFramesDiff;

    // Mettre à jour toutes les séquences suivantes
    for (let i = sequenceIndex + 1; i < newSequences.length; i++) {
        const currentSequence = newSequences[i];
        
        // Mettre à jour start et end de la séquence
        currentSequence.start += timeDiff;
        currentSequence.end += timeDiff;
        
        // Mettre à jour start et end de tous les mots
        currentSequence.words = currentSequence.words.map(word => ({
            ...word,
            start: word.start + timeDiff,
            end: word.end + timeDiff
        }));
    }

    let updatedVoices;
    // Mettre à jour la voix correspondante
    if (video.video.audio?.voices) {
        updatedVoices = [...video.video.audio.voices];
        const voiceIndex = updatedVoices.findIndex(voice => voice.index === sequence.audioIndex);
        
        if (voiceIndex !== -1) {
            const voice = updatedVoices[voiceIndex];
            voice.end += timeDiff;
            voice.durationInFrames = voice.durationInFrames + durationInFramesDiff;

            // Mettre à jour les timings des voix suivantes
            for (let i = voiceIndex + 1; i < updatedVoices.length; i++) {
                updatedVoices[i].start += timeDiff;
                updatedVoices[i].end += timeDiff;
            }
        }
    }

    updateVideo({
      ...video,
      video: {
          ...video.video,
          sequences: newSequences,
          ...(updatedVoices && {
              audio: {
                  ...video.video.audio,
                  voices: updatedVoices
              }
          }),
          metadata: {
              ...video.video.metadata,
              audio_duration: newSequences[newSequences.length - 1].end
          }
      }
    });
  };

  const handleUpdateTransition = (transitionIndex: number, newTransition: ITransition) => {
    if (video && video.video && video.video.transitions) {
      const newTransitions = [...video.video.transitions];
      newTransitions[transitionIndex] = newTransition;
      updateVideo({
        ...video,
        video: {
          ...video.video,
          transitions: newTransitions
        }
      });
    }
  };

  const handleAddTransition = (afterIndex: number) => {
    if (!video?.video) return;

    const newTransitions = [...(video.video.transitions || [])];
    const defaultTransition = {
      ...defaultTransitions[0],
      indexSequenceBefore: afterIndex,
      volume: 0.15,
      sound: defaultSounds[0].url
    };

    newTransitions.push(defaultTransition);

    setSelectedTransitionIndex(newTransitions.length - 1);
    setSelectedSequenceIndex(-1);

    updateVideo({
      ...video,
      video: {
        ...video.video,
        transitions: newTransitions
      }
    });
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

  const handleSubtitleStyleChange = (newStyleOrPosition: any) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video?.subtitle) return prevVideo;

      let newSubtitleStyle;
      if (typeof newStyleOrPosition === 'number') {
        newSubtitleStyle = {
          ...prevVideo.video.subtitle.style,
          position: newStyleOrPosition
        };
      } else {
        newSubtitleStyle = newStyleOrPosition;
      }
      
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          subtitle: {
            ...prevVideo.video.subtitle,
            style: newSubtitleStyle
          }
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleAvatarHeightRatioChange = (ratio: number) => {
    setVideo(prevVideo => {
      if (!prevVideo) return null;
      const newVideo = {
        ...prevVideo,
        settings: {
          ...prevVideo.settings,
          avatarHeightRatio: ratio
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleAvatarPositionChange = (position: { x: number, y: number }) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video?.avatar) return prevVideo;
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          avatar: {
            ...prevVideo.video.avatar,
            settings: {
              ...(prevVideo.video.avatar.settings || {}),
              position: position.x,
              verticalPosition: position.y
            }
          }
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleMediaPositionChange = (sequenceIndex: number, position: { x: number, y: number }) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video?.sequences || !prevVideo.video.sequences[sequenceIndex]?.media) return prevVideo;
      
      const newSequences = [...prevVideo.video.sequences];
      const currentMedia = newSequences[sequenceIndex].media!;
      newSequences[sequenceIndex] = {
        ...newSequences[sequenceIndex],
        media: {
          ...currentMedia,
          position: position
        }
      };
      
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          sequences: newSequences
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleVideoFormatChange = (format: VideoFormat) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video) return prevVideo;
      
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          format: format
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleVideoDimensionChange = (dimension: 'width' | 'height', value: number) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video) return prevVideo;
      
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          [dimension]: value
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleAvatarChange = (avatar: AvatarLook | null) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video) return prevVideo;
      
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          avatar: avatar || undefined
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleLogoPositionChange = (newPosition: LogoPosition) => {
    if (logoData) {
      // Vérifier si la position change réellement
      if (logoData.position.x === newPosition.x && logoData.position.y === newPosition.y) {
        return; // Ne rien faire si la position est déjà la même
      }
      
      setLogoData({
        ...logoData,
        position: newPosition
      });
      setIsDirty(true);
    }
  };

  const handleLogoSizeChange = (newSize: number) => {
    if (logoData) {
      // Vérifier si la taille change réellement
      if (logoData.size === newSize) {
        return; // Ne rien faire si la taille est déjà la même
      }
      
      setLogoData({
        ...logoData,
        size: newSize
      });
      setIsDirty(true);
    }
  };

  const handleElementsChange = (elements: IElement[]) => {
    setVideo(prevVideo => {
      if (!prevVideo?.video) return prevVideo;
      
      const newVideo = {
        ...prevVideo,
        video: {
          ...prevVideo.video,
          elements
        }
      };
      setIsDirty(true);
      return newVideo;
    });
  };

  const handleElementSelect = (media: IMedia) => {
    console.log('handleElementSelect', media)
    if (!video || !video.video || !playerRef.current) return;
    
    const currentFrame = playerRef.current.getCurrentFrame();
    const currentTime = currentFrame / 60;
    
    // Trouver le mot le plus récent qui a déjà commencé (start <= currentTime)
    let closestWord: any = null;
    let closestSequence: any = null;
    let maxStart = -1;
    
    video.video?.sequences.forEach((sequence) => {
        sequence.words.forEach((word) => {
            // Seulement considérer les mots qui ont déjà commencé
            if (word.start <= currentTime && word.start > maxStart) {
                maxStart = word.start;
                closestWord = word;
                closestSequence = sequence;
            }
        });
    });
    
    if (!closestWord || !closestSequence) return;
    
    // Créer le nouvel élément
    const newElement: IElement = {
        media,
        position: { x: 50, y: 50 }, // Position centrale
        start: closestWord.start,
        end: closestSequence!.words[closestSequence!.words.length - 1].end,
        durationInFrames: Math.round((closestSequence!.words[closestSequence!.words.length - 1].end - closestWord.start) * 60),
        size: 25
    };

    console.log('newElement', newElement)
    
    // Ajouter un nouvel élément
    const updatedElements = [...(video.video?.elements || []), newElement];

    console.log('updatedElements', updatedElements)
    handleElementsChange(updatedElements);
  };

  const handleElementPositionChange = (index: number, position: { x: number, y: number }) => {
    if (!video?.video?.elements) return;
    const updatedElements = [...video.video.elements];
    updatedElements[index].position = position;
    console.log('updatedElements', updatedElements)
    handleElementsChange(updatedElements);
  };

  const handleElementSizeChange = (index: number, size: number) => {
    if (!video?.video?.elements) return;
    const updatedElements = [...video.video.elements];
    updatedElements[index].size = size;
    handleElementsChange(updatedElements);
  };

  const handleElementRotationChange = (index: number, rotation: number) => {
    if (!video?.video?.elements) return;
    const updatedElements = [...video.video.elements];
    updatedElements[index].rotation = rotation;
    handleElementsChange(updatedElements);
  };

  const handleElementStartChange = (index: number, start: number) => {
    if (!video?.video?.elements) return;
    
    // Obtenir le timing actuel de la vidéo
    if (playerRef.current) {
      const currentFrame = playerRef.current.getCurrentFrame();
      const currentTime = currentFrame / 60;
      
      // Si le nouveau start est supérieur au timing actuel, avancer la vidéo
      if (start > currentTime) {
        playerRef.current.seekTo(start * 60);
      }
    }
    
    const updatedElements = [...video.video.elements];
    updatedElements[index].start = start;
    updatedElements[index].durationInFrames = Math.round((updatedElements[index].end - start) * 60);
    handleElementsChange(updatedElements);
  };

  const handleElementEndChange = (index: number, end: number) => {
    if (!video?.video?.elements) return;
    
    // Obtenir le timing actuel de la vidéo
    if (playerRef.current) {
      const currentFrame = playerRef.current.getCurrentFrame();
      const currentTime = currentFrame / 60;
      
      // Si le nouveau end est plus petit que le timing actuel, reculer la vidéo vers end - 1
      if (end < currentTime) {
        const newTime = Math.max(0, end - 1); // S'assurer que le temps ne devient pas négatif
        playerRef.current.seekTo(newTime * 60);
      }
    }
    
    const updatedElements = [...video.video.elements];
    updatedElements[index].end = end;
    updatedElements[index].durationInFrames = Math.round((end - updatedElements[index].start) * 60);
    handleElementsChange(updatedElements);
  };

  const [elementToReplaceIndex, setElementToReplaceIndex] = useState<number | null>(null);

  const handleElementMediaChange = (index: number) => {
    setElementToReplaceIndex(index);
    // Le modal sera ouvert depuis VideoPreview
  };

  const handleElementReplaceSelect = (media: IMedia) => {
    if (!video?.video?.elements || elementToReplaceIndex === null) return;
    const updatedElements = [...video.video.elements];
    updatedElements[elementToReplaceIndex].media = media;
    handleElementsChange(updatedElements);
    setElementToReplaceIndex(null);
  };

  const handleElementDelete = (index: number) => {
    if (!video?.video?.elements) return;
    const updatedElements = video.video.elements.filter((_: any, i: number) => i !== index);
    handleElementsChange(updatedElements);
  };

  const handleElementReorder = (fromIndex: number, toIndex: number) => {
    if (!video?.video?.elements) return;
    
    const updatedElements = [...video.video.elements];
    
    // Déplacer l'élément de fromIndex vers toIndex
    const [movedElement] = updatedElements.splice(fromIndex, 1);
    updatedElements.splice(toIndex, 0, movedElement);
    
    handleElementsChange(updatedElements);
  };

  const handleMuteBackgroundMusicChange = (mute: boolean) => {
    setMuteBackgroundMusic(mute);
  };

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
      features={{
        credits: true,
        videoExports: true,
        watermarkRemoval: true,
        videoMinutes: true,
        urlToVideo: false
      }}
    />
    <MobileDisclaimerModal
        isOpen={showMobileDisclaimer}
        onClose={handleCloseMobileDisclaimer}
    />
    <ModalConfirmExport
      cost={(() => {
        // Check if video was created via API (no userId in CREATE step)
        const createEvent = video?.history?.find((h: { step: string }) => h.step === 'CREATE');
        const wasCreatedViaAPI = !createEvent?.user;
 
        return wasCreatedViaAPI ? 0 : calculateGenerationCredits(video?.video?.metadata.audio_duration || 30);
      })()}
      isOpen={showModalExport}
      spaceId={video?.spaceId || ''}
      initialCredits={spaceCredits}
      setIsOpen={setShowModalExport}
      onExportVideo={onExportVideo}
      showWatermark={showWatermark}
      video={video || undefined}
      planName={planName}
      onOpenPricing={() => {
        setModalPricingTitle(exportModalT('modal-pricing-watermark-title'))
        setModalPricingDescription(exportModalT('modal-pricing-watermark-description'))
        setShowModalPricing(true)
      }}
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
              src="/img/logo_little.jpeg"
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
                        transitions={video?.video?.transitions}
                        selectedSequenceIndex={selectedSequenceIndex} 
                        selectedTransitionIndex={selectedTransitionIndex}
                        setSelectedSequenceIndex={setSelectedSequenceIndex} 
                        setSelectedTransitionIndex={setSelectedTransitionIndex}
                        handleWordInputChange={handleWordInputChange} 
                        handleWordAdd={handleWordAdd}
                        handleWordDelete={handleWordDelete}
                        handleWordCut={handleWordCut}
                        onRegenerateAudio={handleRegenerateAudio}
                        onDeleteSequence={handleDeleteSequence}
                        onDeleteTransition={handleDeleteTransition}
                        onAddSequence={handleAddSequence}
                        onAddTransition={handleAddTransition}
                        onUpdateDuration={handleUpdateDuration}
                        playerRef={playerRef}
                        avatar={video?.video?.avatar}
                        handleMergeWordWithPrevious={handleMergeWordWithPrevious}
                        handleMergeWordWithNext={handleMergeWordWithNext}
                        onWordZoomChange={handleWordZoomChange}
                        useVeo3={video?.useVeo3}
                      />
                    </TabsContent>
                    <TabsContent value="subtitle">
                      <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-8rem)]">
                        <Subtitles video={video} setSubtitleStyle={setSubtitleStyle} />
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="audio">
                      <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-8rem)]">
                        <Musics video={video} updateAudioSettings={updateAudioSettings} />
                      </ScrollArea>
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
                  <AudioSettings 
                    video={video} 
                    updateAudioSettings={updateAudioSettings} 
                    muteBackgroundMusic={muteBackgroundMusic}
                    onMuteBackgroundMusicChange={handleMuteBackgroundMusicChange}
                  />
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[calc(100vh-5rem)]">
                  {video?.video?.sequences && video?.video?.sequences[selectedSequenceIndex] && (
                    <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={video.spaceId} hadAvatar={video.video.avatar ? true : false} keywords={video.video.keywords || []} extractedMedia={video.extractedMedia} />
                  )}
                  {video?.video?.transitions && video?.video?.transitions[selectedTransitionIndex] && (
                    <TransitionSettings 
                      video={video} 
                      transition={video.video.transitions[selectedTransitionIndex]} 
                      transitionIndex={selectedTransitionIndex} 
                      spaceId={video.spaceId}
                      updateTransition={handleUpdateTransition}
                    />
                  )}
                </ScrollArea>
              )}
            </Card>
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-transparent" />
          <ResizablePanel defaultSize={20} minSize={10} className="!overflow-visible">
            <Card className="h-full">
                {isClient && !isMobile && (
                    <VideoPreview 
                        playerRef={playerRef} 
                        video={video} 
                        isMobile={isMobile} 
                        showWatermark={showWatermark} 
                        hasExistingReview={hasExistingReview}
                        muteBackgroundMusic={muteBackgroundMusic}
                        onSubtitleStyleChange={handleSubtitleStyleChange}
                        onAvatarHeightRatioChange={handleAvatarHeightRatioChange}
                        onAvatarPositionChange={handleAvatarPositionChange}
                        onMediaPositionChange={handleMediaPositionChange}
                        onVideoFormatChange={handleVideoFormatChange}
                        onVideoWidthChange={(w) => handleVideoDimensionChange('width', w)}
                        onVideoHeightChange={(h) => handleVideoDimensionChange('height', h)}
                        onAvatarChange={handleAvatarChange}
                        onLogoPositionChange={handleLogoPositionChange}
                        onLogoSizeChange={handleLogoSizeChange}
                        logoData={logoData}
                        spaceId={video?.spaceId}
                        onElementSelect={handleElementSelect}
                        onElementPositionChange={handleElementPositionChange}
                        onElementSizeChange={handleElementSizeChange}
                        onElementRotationChange={handleElementRotationChange}
                        onElementStartChange={handleElementStartChange}
                        onElementEndChange={handleElementEndChange}
                        onElementMediaChange={handleElementMediaChange}
                        onElementDelete={handleElementDelete}
                        onElementReorder={handleElementReorder}
                        elementToReplaceIndex={elementToReplaceIndex}
                        onElementReplaceSelect={handleElementReplaceSelect}
                    />
                )}
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
          {isClient && isMobile && (
            <VideoPreview 
                playerRef={playerRef} 
                video={video} 
                isMobile={isMobile} 
                showWatermark={showWatermark} 
                hasExistingReview={hasExistingReview}
                muteBackgroundMusic={muteBackgroundMusic}
                onSubtitleStyleChange={handleSubtitleStyleChange}
                onAvatarHeightRatioChange={handleAvatarHeightRatioChange}
                onAvatarPositionChange={handleAvatarPositionChange}
                onMediaPositionChange={handleMediaPositionChange}
                onVideoFormatChange={handleVideoFormatChange}
                onVideoWidthChange={(w) => handleVideoDimensionChange('width', w)}
                onVideoHeightChange={(h) => handleVideoDimensionChange('height', h)}
                onAvatarChange={handleAvatarChange}
                onLogoPositionChange={handleLogoPositionChange}
                onLogoSizeChange={handleLogoSizeChange}
                logoData={logoData}
                spaceId={video?.spaceId}
                onElementSelect={handleElementSelect}
                onElementPositionChange={handleElementPositionChange}
                onElementSizeChange={handleElementSizeChange}
                onElementRotationChange={handleElementRotationChange}
                onElementStartChange={handleElementStartChange}
                onElementEndChange={handleElementEndChange}
                onElementMediaChange={handleElementMediaChange}
                onElementDelete={handleElementDelete}
                onElementReorder={handleElementReorder}
                elementToReplaceIndex={elementToReplaceIndex}
                onElementReplaceSelect={handleElementReplaceSelect}
            />
          )}
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
              <ScrollArea className="h-[calc(100vh-25rem)] mx-2">
                <Sequences 
                  sequences={video?.video?.sequences || []} 
                  transitions={video?.video?.transitions}
                  selectedSequenceIndex={selectedSequenceIndex} 
                  selectedTransitionIndex={selectedTransitionIndex}
                  setSelectedSequenceIndex={setSelectedSequenceIndex} 
                  setSelectedTransitionIndex={setSelectedTransitionIndex}
                  setActiveTabMobile={setActiveTabMobile}
                  isMobile={isMobile}
                  handleWordInputChange={handleWordInputChange} 
                  handleWordAdd={handleWordAdd}
                  handleWordDelete={handleWordDelete}
                  handleWordCut={handleWordCut}
                  onRegenerateAudio={handleRegenerateAudio}
                  onDeleteSequence={handleDeleteSequence}
                  onDeleteTransition={handleDeleteTransition}
                  onAddSequence={handleAddSequence}
                  onAddTransition={handleAddTransition}
                  onUpdateDuration={handleUpdateDuration}
                  playerRef={playerRef}
                  avatar={video?.video?.avatar}
                  handleMergeWordWithPrevious={handleMergeWordWithPrevious}
                  handleMergeWordWithNext={handleMergeWordWithNext}
                  onWordZoomChange={handleWordZoomChange}
                  useVeo3={video?.useVeo3}
                />
              </ScrollArea>
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
                  <SequenceSettings sequence={video.video.sequences[selectedSequenceIndex]} sequenceIndex={selectedSequenceIndex} setSequenceMedia={setSequenceMedia} spaceId={video.spaceId} hadAvatar={video.video.avatar ? true : false} keywords={video.video.keywords || []} extractedMedia={video.extractedMedia} />
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings-transition">
              <ScrollArea className="h-[calc(100vh-25rem)] mx-2">
                {video?.video?.transitions && video?.video?.transitions[selectedTransitionIndex] && (
                  <TransitionSettings 
                    video={video} 
                    transition={video.video.transitions[selectedTransitionIndex]} 
                    transitionIndex={selectedTransitionIndex} 
                    spaceId={video.spaceId}
                    updateTransition={handleUpdateTransition}
                  />
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
                <AudioSettings 
                  video={video} 
                  updateAudioSettings={updateAudioSettings} 
                  muteBackgroundMusic={muteBackgroundMusic}
                  onMuteBackgroundMusicChange={handleMuteBackgroundMusicChange}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
    </>
  )
}