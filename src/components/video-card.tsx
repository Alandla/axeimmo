'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useCallback } from 'react'
import { MoreVertical, Pen, Edit, Trash2, Settings2, Video as VideoIcon, VideoOff, Download, Loader2 } from 'lucide-react'
import { formatDistanceToNow, Locale } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import { Button } from "@/src/components/ui/button"
import { cn } from '../lib/utils'
import { Avatar, AvatarFallback } from './ui/avatar'
import { VideoWithCreator } from '../app/dashboard/page'
import { AvatarImage } from '@radix-ui/react-avatar'
import { basicApiCall } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { useVideoToDeleteStore } from '../store/videoToDelete'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useUsersStore } from '../store/creatorUserVideo'
import VideoThumbnail from './video-thumbnail'

function formatDuration(seconds: number): string {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function VideoCard({ video, setIsModalConfirmDeleteOpen }: { video: VideoWithCreator, setIsModalConfirmDeleteOpen: (isOpen: boolean) => void }) {
  const t = useTranslations('videos')
  const { data: session } = useSession()

  const { toast } = useToast();
  const { setVideo } = useVideoToDeleteStore()
  const { fetchUser } = useUsersStore()
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(video.title);
  const [creator, setCreator] = useState(video.creator)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [downloadUrls, setDownloadUrls] = useState<string[]>([])
  const [isLoadingExports, setIsLoadingExports] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (e: any) => {
    e.stopPropagation()
    setVideo(video)
    setIsModalConfirmDeleteOpen(true)
    setIsDropdownOpen(false)
  }

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  }, []);

  const handleTitleSave = useCallback(async () => {
    setIsEditing(false);
    if (editedTitle !== video.title) {
      try {
        video.title = editedTitle;
        await basicApiCall('/video/save', {
          video: {
            ...video,
            title: editedTitle
          }
        });
        toast({
          title: t('toast.title-updated'),
          description: t('toast.description-updated'),
          variant: "confirm",
        });
      } catch (error) {
        console.error(t('toast.error-message'), error);
        setEditedTitle(video.title); // Restaurer l'ancien titre en cas d'erreur
      }
    }
  }, [editedTitle, video]);

  const handleDropdownOpen = async (isOpen: boolean) => {
    setIsDropdownOpen(isOpen)
    if (isOpen) {
      const promises = []
      
      // Charger les informations du créateur si nécessaire
      if (!creator.name && creator.id) {
        promises.push(
          fetchUser(creator.id).then(userData => {
            setCreator(userData)
          }).catch(error => {
            console.error('Erreur lors du chargement du créateur:', error)
          })
        )
      }
      
      // Charger les exports si pas encore fait
      if (!isLoadingExports && downloadUrls.length === 0) {
        promises.push(
          setIsLoadingExports(true),
          basicApiCall('/video/exports', { videoId: video.id }).then(response => {
            const downloadUrls = response as string[]
            setDownloadUrls(downloadUrls || [])
          }).catch(error => {
            console.error('Erreur lors du chargement des exports:', error)
            setDownloadUrls([])
          }).finally(() => {
            setIsLoadingExports(false)
          })
        )
      }
      
      // Exécuter toutes les promesses en parallèle
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }
    }
  }

  const handleDownload = useCallback(() => {
    if (downloadUrls.length > 0) {
      window.open(downloadUrls[0], '_blank')
    }
  }, [downloadUrls])

  const isOutdated = !video.video?.audio?.voices || video.video?.audio?.voices.length === 0

  return (
    <div className="relative">
      <div
        className="relative bg-muted aspect-[16/9] rounded-lg overflow-hidden"
      >
        {isOutdated && (
          <div className="absolute top-2 left-2 right-2 z-10 bg-black bg-opacity-75 text-white px-2 py-1 text-sm rounded-md text-center">
            {t('video.outdated')}
          </div>
        )}
        <div className="relative w-full h-full">
          <VideoThumbnail 
            video={video} 
            alt={video.title || ''}
            className={cn(isOutdated && "opacity-50")}
          />
          {isOutdated ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
              <p className="text-white text-sm text-center px-4">
                {t('video.outdated-help')}
              </p>
            </div>
          ) : (
            <Link href={`/edit/${video.id}`} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
              <Pen className="text-white w-8 h-8" />
            </Link>
          )}
        </div>
        <div className="absolute z-20 bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded-md">
          {formatDuration(video.video?.metadata?.audio_duration || 0)}
        </div>
      </div>
      <div className="mt-2 flex justify-between items-start space-x-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="w-full text-lg font-semibold border-0 border-b border-b-input focus:outline-none focus:ring-0 bg-transparent"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-semibold truncate cursor-text" 
              onClick={() => setIsEditing(true)}
            >
              {video.title}
            </h3>
          )}
          <p className="text-sm text-gray-500 truncate">
            {formatDistanceToNow(video.createdAt ? new Date(video.createdAt) : new Date(), { addSuffix: true, locale: session?.user?.options?.lang === 'en' ? enUS : fr })}
          </p>
        </div>
        <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('more-options')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={"bottom"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {creator.image && <AvatarImage src={creator.image} alt={creator.name ?? ''} />}
                  <AvatarFallback className="rounded-lg">{creator.name?.charAt(0) ?? ''}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {!creator.name ? (
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <span className="truncate font-semibold">{creator.name}</span>
                  )}
                  <span className="truncate text-xs">
                    {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                asChild
                disabled={isOutdated}
                className={cn(isOutdated && "cursor-not-allowed opacity-50")}
              >
                <Link href={isOutdated ? "#" : `/edit/${video.id}`}>
                  <Edit />
                  {t('dropdown-menu.edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
              >
                <Pen  />
                {t('dropdown-menu.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                disabled={isLoadingExports || downloadUrls.length === 0}
              >
                {isLoadingExports ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download />
                )}
                {t('dropdown-menu.download')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleDelete(e)
              }}
              className={cn(
                "flex items-center cursor-pointer text-destructive",
                "hover:bg-red-200 hover:text-destructive",
                "focus:bg-red-200 focus:text-destructive"
              )}
            >
              <Trash2 />
              {t('dropdown-menu.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}