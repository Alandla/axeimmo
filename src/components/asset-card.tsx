'use client'

import Image from 'next/image'
import { useState, useRef, useCallback, useEffect } from 'react'
import { MoreVertical, Pen, Eye, Trash2, Video as VideoIcon, Image as ImageIcon, ImagePlay, Check } from 'lucide-react'
import SkeletonVideoFrame from './ui/skeleton-video-frame'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/src/hooks/use-toast'
import { basicApiCall } from '@/src/lib/api'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
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
import { IMediaSpace } from '../types/space'
import ModalConfirmDeleteAsset from './modal/confirm-delete-asset'
import { IMedia } from '../types/video'

interface AssetCardProps {
  mediaSpace: IMediaSpace
  spaceId: string
  setMedia: (media: IMediaSpace) => void
  onClick: () => void
  onDelete?: (media: IMedia) => void
  isSelected?: boolean
  selectionMode?: boolean
}

export default function AssetCard({ mediaSpace, spaceId, setMedia, onClick, onDelete, isSelected = false, selectionMode = false }: AssetCardProps) {
  const t = useTranslations('assets')
  const { data: session } = useSession()
  const { toast } = useToast()
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(mediaSpace.media.name)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { media } = mediaSpace

  const inputRef = useRef<HTMLInputElement>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Récupérer les informations du créateur depuis activeSpace.members
  const getCreator = () => {
    if (mediaSpace.uploadedBy && activeSpace?.members) {
      return activeSpace.members.find(member => member.id === mediaSpace.uploadedBy);
    }
    return { id: '', name: '', image: '' };
  };

  const creator = getCreator();

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
          description: t('toast.error-saved-description'),
          variant: "destructive",
        })
      }
    }
  }, [editedName, mediaSpace.media])

  const handleDelete = async (mediaToDelete: IMedia) => {
    try {
      await basicApiCall('/media/delete', {
        media: mediaToDelete,
        spaceId: spaceId
      })

      onDelete?.(mediaToDelete)

      if (activeSpace && activeSpace.id === spaceId) {
        let storageToRemove = 0;
        if (mediaToDelete.type === 'image' && mediaToDelete.image && mediaToDelete.image.size) {
          storageToRemove += mediaToDelete.image.size;
        } else if (mediaToDelete.type === 'video' && mediaToDelete.video && mediaToDelete.video.size) {
          storageToRemove += mediaToDelete.video.size;
        }
        
        if (storageToRemove > 0) {
          setActiveSpace({
            ...activeSpace,
            usedStorageBytes: Math.max(0, (activeSpace.usedStorageBytes || 0) - storageToRemove)
          });
        }
      }
      
      toast({
        title: t('toast.deleted'),
        description: t('toast.deleted-description'),
        variant: "confirm",
      })
    } catch (error) {
      console.error('Error deleting media:', error)
      toast({
        title: t('toast.error'),
        description: t('toast.error-deleted-description'),
        variant: "destructive",
      })
    }
    setIsDropdownOpen(false)
  }

  return (
    <>
      <div className="relative">
        <div 
          className={`relative bg-muted aspect-[16/9] rounded-lg overflow-hidden cursor-pointer group`}
          onClick={onClick}
        >
          {media.usage === 'element' && (
            <div className="absolute top-2 left-2 z-30 bg-white/50 backdrop-blur-sm text-black text-xs px-2 py-1 rounded-md flex items-center gap-1">
              <ImagePlay className="h-3 w-3" />
              <span>{t('element-badge')}</span>
            </div>
          )}
          
          {selectionMode && (
            <div className="absolute top-2 right-2 z-30">
              <div className={`w-4 h-4 shrink-0 transition-all duration-300 rounded-sm border shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center justify-center ${
                isSelected 
                  ? 'bg-primary border-primary text-black' 
                  : 'bg-white border'
              }`}>
                {isSelected && <Check className="h-4 w-4 text-current" />}
              </div>
            </div>
          )}
          
          {media.image?.link && !imageError ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-black/90">
                <Image
                  src={media.image.link}
                  alt=""
                  layout="fill"
                  objectFit="cover"
                  priority
                  className="blur-md scale-110"
                  onError={() => setImageError(true)}
                />
              </div>
              <Image
                src={media.image.link}
                alt={media.name || ''}
                layout="fill"
                objectFit="contain"
                priority
                className="relative z-10"
                onError={() => setImageError(true)}
              />
              {!selectionMode && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
                  <Eye className="text-white w-8 h-8" />
                </div>
              )}
            </div>
          ) : media.video?.frames && media.video.frames.length > 0 ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-black/90">
                <Image
                  src={media.video.frames[0]}
                  alt=""
                  layout="fill"
                  objectFit="cover"
                  priority
                  className="blur-md scale-110"
                />
              </div>
              <Image
                src={media.video.frames[0]}
                alt={media.name || ''}
                layout="fill"
                objectFit="contain"
                priority
                className="relative z-10"
              />
              {!selectionMode && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
                  <Eye className="text-white w-8 h-8" />
                </div>
              )}
            </div>
          ) : media.type === 'video' && media.video?.link ? (
            <div className="relative w-full h-full">
              <SkeletonVideoFrame
                srcVideo={media.video.link}
                className="w-full h-full"
                startAt={0}
                alt={media.name || ''}
              />
              {!selectionMode && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
                  <Eye className="text-white w-8 h-8" />
                </div>
              )}
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
            {!selectionMode && isEditing ? (
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
                onClick={() => !selectionMode && setIsEditing(true)}
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

          {!selectionMode && (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
                      {creator?.image && <AvatarImage src={creator.image} alt={creator.name ?? ''} />}
                      <AvatarFallback className="rounded-lg">{creator?.name?.charAt(0) ?? ''}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      {!creator?.name ? (
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                      ) : (
                        <span className="truncate font-semibold">{creator?.name}</span>
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDeleteModalOpen(true)
                    setIsDropdownOpen(false)
                  }}
                  className="text-destructive focus:text-destructive hover:bg-red-200 focus:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('dropdown-menu.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <ModalConfirmDeleteAsset
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        media={mediaSpace.media}
        handleDeleteAsset={handleDelete}
      />
    </>
  )
} 