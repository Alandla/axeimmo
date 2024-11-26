'use client'

import ModalConfirmDelete from "@/src/components/modal/confirm-delete-video";
import VideoCard from "@/src/components/video-card";
import VideoCardSkeleton from "@/src/components/video-card-skeleton";
import { useToast } from "@/src/hooks/use-toast";
import { basicApiCall } from "@/src/lib/api";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { useVideoToDeleteStore } from "@/src/store/videoToDelete";
import { IVideo } from "@/src/types/video";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name?: string;
  image?: string;
}

export interface VideoWithCreator extends IVideo {
  creator: User
}

export default function Dashboard() {
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoWithCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalConfirmDeleteOpen, setIsModalConfirmDeleteOpen] = useState(false)
  const { video, setVideo } = useVideoToDeleteStore()
  const { activeSpace } = useActiveSpaceStore()

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true)
      const rawVideos: IVideo[] = await basicApiCall('/space/getVideos', { spaceId: activeSpace?.id })
      
      // Créer un nouveau Map pour les utilisateurs
      const newUsers = new Map<string, User>()
      
      // Traiter chaque vidéo pour trouver son créateur
      const processedVideos = await Promise.all(rawVideos.map(async video => {
        const createEvent = video.history?.find(h => h.step === 'CREATE')
        const userId = createEvent?.user

        if (userId && !newUsers.has(userId)) {
          // Récupérer les données de l'utilisateur depuis l'API
          const user: User = await basicApiCall('/user/getByIdForVideo', { userId })
          
          newUsers.set(userId, {
            id: userId,
            name: user?.name,
            image: user?.image
          })
        }

        return {
          ...video,
          creator: newUsers.get(userId || '') || {
            id: userId || '',
            name: '',
            image: ''
          }
        }
      }))

      setVideos(processedVideos.reverse())
      setIsLoading(false)
    }
    fetchVideos()
  }, [activeSpace])

  const handleDeleteVideo = async (video: IVideo) => {
    try {
      await basicApiCall('/video/delete', { video })
      toast({
        title: "Video deleted",
        description: "Your video has been deleted",
        variant: "confirm",
      })
      setVideos(videos.filter(v => v.id !== video.id))
      setIsModalConfirmDeleteOpen(false)
    } catch (error) {
      setIsModalConfirmDeleteOpen(false)
      toast({
        title: "Error",
        description: "An error occurred while deleting your video",
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
      ) : (
        videos.map((video) => (
          <VideoCard key={video.id} video={video} setIsModalConfirmDeleteOpen={setIsModalConfirmDeleteOpen} />
        ))
        )}
      </div>
    </>
  )
}
