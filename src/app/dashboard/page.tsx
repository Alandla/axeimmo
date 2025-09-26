'use client'

import ModalConfirmDelete from "@/src/components/modal/confirm-delete-video";
import VideoCard from "@/src/components/video-card";
import VideoCardSkeleton from "@/src/components/video-card-skeleton";
import { useToast } from "@/src/hooks/use-toast";
import { basicApiCall } from "@/src/lib/api";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { useVideosStore } from "@/src/store/videosStore";
import { IVideo } from "@/src/types/video";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useTranslations } from "next-intl";
import { Sparkles, VideoOff } from "lucide-react"
import { Button } from "@/src/components/ui/button";
import { useScreenSize } from "@/src/hooks/use-screen-size";
import { PaginationControls } from "@/src/components/ui/pagination-controls"
import { VideoFilters } from "@/src/components/video-filters"
import { useVideoFiltersStore } from "@/src/store/videoFiltersStore"

export default function Dashboard() {
  const t = useTranslations('videos')
  const { toast } = useToast()
  const [videos, setVideos] = useState<IVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalConfirmDeleteOpen, setIsModalConfirmDeleteOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const { activeSpace } = useActiveSpaceStore()
  const { fetchVideosInBackground, getCachedVideos, clearSpaceCache } = useVideosStore()
  const { itemsPerPage, screenSize } = useScreenSize()
  const { filters, clearFilters } = useVideoFiltersStore()

  // Réinitialiser la page lors du changement d'espace
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSpace?.id]);

  // Charger les vidéos avec cache stale-while-revalidate
  useEffect(() => {
    if (!activeSpace?.id) return;

    // Capturer les paramètres actuels pour vérifier s'ils ont changé
    const spaceId = activeSpace.id;
    const currentPage_ = currentPage;
    const itemsPerPage_ = itemsPerPage;
    const currentFilters = [...filters];
    const currentFiltersStr = JSON.stringify(currentFilters);

    // D'abord vérifier le cache
    const cachedData = getCachedVideos(spaceId, currentPage_, itemsPerPage_, currentFilters);
    
    if (cachedData) {
      setVideos(cachedData.videos);
      setTotalPages(cachedData.totalPages);
      setTotalCount(cachedData.totalCount);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Puis lancer la requête en arrière-plan
    const loadVideos = async () => {
      try {
        const videosFromApi = await fetchVideosInBackground(spaceId, currentPage_, itemsPerPage_, currentFilters);

        // Vérifier que les paramètres n'ont pas changé entre temps
        if (activeSpace?.id === spaceId && 
            currentPage === currentPage_ && 
            itemsPerPage === itemsPerPage_ && 
            JSON.stringify(filters) === currentFiltersStr) {
          setVideos(videosFromApi.videos);
          setTotalPages(videosFromApi.totalPages);
          setTotalCount(videosFromApi.totalCount);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des vidéos:', error);
        
        // Si on n'avait pas de cache, afficher l'erreur
        if (!cachedData) {
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
  }, [activeSpace?.id, currentPage, itemsPerPage, filters]);

  const handleDeleteVideo = async (video: IVideo) => {
    try {
      await basicApiCall('/video/delete', { video })
      toast({
        title: t('toast.title-video-deleted'),
        description: t('toast.description-video-deleted'),
        variant: "confirm",
      })

      // Rafraîchir la page actuelle après suppression
      if (activeSpace?.id) {
        clearSpaceCache(activeSpace.id);
        const videosFromApi = await fetchVideosInBackground(activeSpace.id, currentPage, itemsPerPage, filters);
        setVideos(videosFromApi.videos);
        setTotalPages(videosFromApi.totalPages);
        setTotalCount(videosFromApi.totalCount);
        
        // Si on a supprimé la dernière vidéo de la page et qu'on n'est pas sur la première page, 
        // retourner à la page précédente
        if (videosFromApi.videos.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
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

  const handleDuplicateVideo = async (video: IVideo) => {
    if (!activeSpace?.id) return
    
    setIsDuplicating(true)
    
    try {
      const duplicatedVideo = await basicApiCall('/video/duplicate', { 
        videoId: video.id,
        spaceId: activeSpace.id
      })

      toast({
        title: t('toast.title-video-duplicated'),
        description: t('toast.description-video-duplicated'),
        variant: "confirm",
      })

      // Rafraîchir la liste des vidéos
      clearSpaceCache(activeSpace.id)
      const videosFromApi = await fetchVideosInBackground(activeSpace.id, currentPage, itemsPerPage, filters)
      setVideos(videosFromApi.videos)
      setTotalPages(videosFromApi.totalPages)
      setTotalCount(videosFromApi.totalCount)
      
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
      toast({
        title: t('toast.error-title'),
        description: t('toast.error-video-duplicated'),
        variant: "destructive",
      })
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <>
      <ModalConfirmDelete isOpen={isModalConfirmDeleteOpen} setIsOpen={setIsModalConfirmDeleteOpen} handleDeleteVideo={handleDeleteVideo} />
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="ml-4">
            <VideoFilters />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
            {isDuplicating && (
              <VideoCardSkeleton key="duplicating" />
            )}
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <VideoCardSkeleton key={index} />
              ))
            ) : videos.length === 0 && totalCount === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <VideoOff className="w-12 h-12 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  {filters.length > 0 ? t('no-filtered-videos') : t('no-videos')}
                </h2>
                <p className="text-gray-500 mb-6 text-center">
                  {filters.length > 0 ? t('no-filtered-videos-description') : t('no-videos-description')}
                </p>
                {filters.length > 0 ? (
                  <Button variant="outline" onClick={clearFilters} className="mb-4">
                    {t('clear-filters')}
                  </Button>
                ) : (
                  <Link href="/dashboard/create">
                    <Button size="lg">
                      <Sparkles className="w-4 h-4" />
                      {t('create-video')}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              videos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  setIsModalConfirmDeleteOpen={setIsModalConfirmDeleteOpen}
                  onDuplicate={handleDuplicateVideo}
                />
              ))
            )}
          </div>
        </div>
        
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          screenSize={screenSize}
          translationKey="videos"
        />
      </div>
    </>
  )
}
