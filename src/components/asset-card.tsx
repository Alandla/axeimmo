'use client'

import Image from 'next/image'
import { useState, useRef, useCallback } from 'react'
import { MoreVertical, Pen, Eye, Trash2, Video as VideoIcon, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/src/hooks/use-toast'
import { basicApiCall } from '@/src/lib/api'
import { IMediaSpace } from '@/src/types/space'
import { useUsersStore } from '@/src/store/creatorUserVideo'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { MediaSpaceWithCreator } from '../app/dashboard/assets/page'

interface AssetCardProps {
  mediaSpace: MediaSpaceWithCreator
  spaceId: string
  setMedia: (media: MediaSpaceWithCreator) => void
  onClick: () => void
}

export default function AssetCard({ mediaSpace, spaceId, setMedia, onClick }: AssetCardProps) {
  const t = useTranslations('assets')
  const { data: session } = useSession()
  const { toast } = useToast()
  const { fetchUser } = useUsersStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(mediaSpace.media.name)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { media } = mediaSpace

  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback(() => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 200)
  }, [])

  const handleDetailsClick = (e: React.MouseEvent) => {
    setIsDropdownOpen(false)
    onClick()
  }

  const handleNameSave = useCallback(async () => {
    setIsEditing(false)
    if (editedName !== mediaSpace.media.name) {
      try {
        const updatedSpaceMedia = {
            ...mediaSpace,
            media: {
              ...mediaSpace.media,
              name: editedName
            }
        }

        setMedia(updatedSpaceMedia)

        await basicApiCall('/media/update', {
          spaceId: spaceId,
          mediaSpace: updatedSpaceMedia
        })

        toast({
          title: t('toast.saved'),
          description: t('toast.saved-description'),
          variant: "confirm",
        })
      } catch (error) {
        console.error('Error updating media name:', error)
        setEditedName(mediaSpace.media.name)
        toast({
          title: t('toast.error'),
          description: t('toast.error-description'),
          variant: "destructive",
        })
      }
    }
  }, [editedName, mediaSpace.media])

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await basicApiCall('/media/delete', {
        mediaId: mediaSpace.media.id
      })
      toast({
        title: t('toast.deleted'),
        description: t('toast.deleted-description'),
        variant: "confirm",
      })
    } catch (error) {
      console.error('Error deleting media:', error)
      toast({
        title: t('toast.error'),
        description: t('toast.error-description'),
        variant: "destructive",
      })
    }
    setIsDropdownOpen(false)
  }

  const handleDropdownOpen = async (isOpen: boolean) => {
    setIsDropdownOpen(isOpen)
    if (isOpen && !mediaSpace.creator.name && mediaSpace.creator.id) {
      const userData = await fetchUser(mediaSpace.creator.id)
      setMedia({
        ...mediaSpace,
        creator: userData
      })
    }
  }

  return (
    <div className="relative">
      <div className="relative bg-muted aspect-[16/9] rounded-lg overflow-hidden cursor-pointer group" onClick={onClick}>
        {media.image?.link ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-black/90">
              <Image
                src={media.image?.link}
                alt=""
                layout="fill"
                objectFit="cover"
                priority
                className="blur-md scale-110"
              />
            </div>
            <Image
              src={media.image?.link}
              alt={media.name || ''}
              layout="fill"
              objectFit="contain"
              priority
              className="relative z-10"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
              <Eye className="text-white w-8 h-8" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            {media.type === 'video' ? (
              <VideoIcon className="w-12 h-12 text-gray-400" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-start space-x-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              className="w-full text-lg font-semibold border-0 border-b border-b-input focus:outline-none focus:ring-0 bg-transparent"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-semibold truncate cursor-text" 
              onClick={() => setIsEditing(true)}
            >
              {media.name}
            </h3>
          )}
          <p className="text-sm text-gray-500 truncate">
            {formatDistanceToNow(mediaSpace.uploadedAt ? new Date(mediaSpace.uploadedAt) : new Date(), { 
              addSuffix: true, 
              locale: session?.user?.options?.lang === 'en' ? enUS : fr 
            })}
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
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {mediaSpace.creator.image && <AvatarImage src={mediaSpace.creator.image} alt={mediaSpace.creator.name ?? ''} />}
                  <AvatarFallback className="rounded-lg">{mediaSpace.creator.name?.charAt(0) ?? ''}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {!mediaSpace.creator.name ? (
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <span className="truncate font-semibold">{mediaSpace.creator.name}</span>
                  )}
                  <span className="truncate text-xs">
                    {mediaSpace.uploadedAt ? new Date(mediaSpace.uploadedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleDetailsClick}>
                <Eye className="h-4 w-4" />
                {t('dropdown-menu.details')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                startEditing()
              }}>
                <Pen className="h-4 w-4" />
                {t('dropdown-menu.rename')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive hover:bg-red-200 focus:bg-red-200"
            >
              <Trash2 className="h-4 w-4" />
              {t('dropdown-menu.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 