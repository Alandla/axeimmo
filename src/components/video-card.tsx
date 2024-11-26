'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useCallback } from 'react'
import { MoreVertical, Pen, Edit, Trash2, Settings2, Video as VideoIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

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
import { IVideo } from '@/src/types/video'
import { cn } from '../lib/utils'
import { Avatar, AvatarFallback } from './ui/avatar'
import { VideoWithCreator } from '../app/dashboard/page'
import { AvatarImage } from '@radix-ui/react-avatar'
import { basicApiCall } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { useVideoToDeleteStore } from '../store/videoToDelete'

function formatDuration(seconds: number): string {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function VideoCard({ video, setIsModalConfirmDeleteOpen }: { video: VideoWithCreator, setIsModalConfirmDeleteOpen: (isOpen: boolean) => void }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(video.title);
  const { setVideo } = useVideoToDeleteStore()
  const inputRef = useRef<HTMLInputElement>(null);

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
          title: "Title updated",
          description: "Your video title has been updated",
          variant: "confirm",
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du titre:', error);
        setEditedTitle(video.title); // Restaurer l'ancien titre en cas d'erreur
      }
    }
  }, [editedTitle, video]);

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
            {formatDistanceToNow(video.createdAt ? new Date(video.createdAt) : new Date(), { addSuffix: true, locale: fr })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Plus d'options</span>
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
                  {video.creator.image && <AvatarImage src={video.creator.image} alt={video.creator.name ?? ''} />}
                  <AvatarFallback className="rounded-lg">{video.creator.name?.charAt(0) ?? ''}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{video.creator.name}</span>
                  <span className="truncate text-xs">{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/edit/${video.id}`}>
                  <Edit />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
              >
                <Pen  />
                Rename
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
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}