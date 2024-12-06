'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useCallback } from 'react'
import { MoreVertical, Pen, Edit, Trash2, Settings2, Video as VideoIcon } from 'lucide-react'
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(video.title);
  const { setVideo } = useVideoToDeleteStore()
  const inputRef = useRef<HTMLInputElement>(null);
  const { fetchUser } = useUsersStore()
  const [creator, setCreator] = useState(video.creator)

  const handleDelete = () => {
    setVideo(video)
    setIsModalConfirmDeleteOpen(true)
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
    if (isOpen && !creator.name && creator.id) {
      const userData = await fetchUser(creator.id)
      setCreator(userData)
    }
  }

  return (
    <div className="relative">
      <div
        className="relative bg-muted aspect-[16/9] rounded-lg overflow-hidden"
      >
        {video.video?.thumbnail ? (
          <Image
            src={video.video.thumbnail}
            alt={video.title || ''}
            layout="fill"
            objectFit="cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <VideoIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <Link href={`/edit/${video.id}`} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
          <Pen className="text-white w-8 h-8" />
        </Link>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded-md">
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
        <DropdownMenu onOpenChange={handleDropdownOpen}>
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
                  {video.creator.image && <AvatarImage src={video.creator.image} alt={creator.name ?? ''} />}
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
              <DropdownMenuItem asChild>
                <Link href={`/edit/${video.id}`}>
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
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className={cn(
                "flex items-center cursor-pointer",
                "hover:bg-red-200 hover:text-red-600",
                "focus:bg-red-200 focus:text-red-600"
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