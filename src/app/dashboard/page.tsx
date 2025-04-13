'use client'

import ModalConfirmDelete from "@/src/components/modal/confirm-delete-video";
import VideoCard from "@/src/components/video-card";
import VideoCardSkeleton from "@/src/components/video-card-skeleton";
import { useToast } from "@/src/hooks/use-toast";
import { basicApiCall } from "@/src/lib/api";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { useVideoToDeleteStore } from "@/src/store/videoToDelete";
import { useVideosStore } from "@/src/store/videosStore";
import { IVideo } from "@/src/types/video";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useTranslations } from "next-intl";
import { Sparkles, VideoOff } from "lucide-react"
import { Button } from "@/src/components/ui/button";
import AffiliateTracker from "@/src/lib/referral";

interface User {
  id: string;
  name?: string;
  image?: string;
}

export interface VideoWithCreator extends IVideo {
  creator: User
}

export default function Dashboard() {
  const t = useTranslations('videos')
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoWithCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalConfirmDeleteOpen, setIsModalConfirmDeleteOpen] = useState(false)
  const { activeSpace } = useActiveSpaceStore()
  const { videosBySpace, setVideos: setStoreVideos, fetchVideos } = useVideosStore()

  // Charger les vidéos
  useEffect(() => {
    if (!activeSpace?.id) return;

    const cachedVideos = videosBySpace.get(activeSpace.id);
    
    if (cachedVideos) {
      setVideos(cachedVideos);
      setIsLoading(false);
    }

    const loadVideos = async () => {
      try {
        if (!cachedVideos) {
          setIsLoading(true);
        }

        const videosFromApi = await fetchVideos(activeSpace.id, true);

        setVideos(videosFromApi.videos);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des vidéos:', error);
        if (!cachedVideos) {
          toast({
            title: t('toast.error-title'),
            description: t('toast.error-loading-videos'),
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    };
    
    loadVideos();
  }, [activeSpace]);

  const handleDeleteVideo = async (video: IVideo) => {
    try {
      await basicApiCall('/video/delete', { video })
      toast({
        title: t('toast.title-video-deleted'),
        description: t('toast.description-video-deleted'),
        variant: "confirm",
      })

      const updatedVideos = videos.filter(v => v.id !== video.id);
      setVideos(updatedVideos);

      if (activeSpace?.id) {
        setStoreVideos(activeSpace.id, updatedVideos);
      }
      
      setIsModalConfirmDeleteOpen(false)
    } catch (error) {
      setIsModalConfirmDeleteOpen(false)
      toast({
        title: t('toast.error-title'),
        description: t('toast.error-video-deleted'),
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <ModalConfirmDelete isOpen={isModalConfirmDeleteOpen} setIsOpen={setIsModalConfirmDeleteOpen} handleDeleteVideo={handleDeleteVideo} />
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))
        ) : videos.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <VideoOff className="w-12 h-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('no-videos')}</h2>
            <p className="text-gray-500 mb-6 text-center">
              {t('no-videos-description')}
            </p>
            <Link href="/dashboard/create">
              <Button size="lg">
                <Sparkles className="w-4 h-4" />
                {t('create-video')}
              </Button>
            </Link>
          </div>
        ) : (
          videos.map((video) => (
            <VideoCard key={video.id} video={video} setIsModalConfirmDeleteOpen={setIsModalConfirmDeleteOpen} />
          ))
        )}
      </div>
    </>
  )
}
