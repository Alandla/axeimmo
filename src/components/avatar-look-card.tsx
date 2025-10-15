'use client'

import { Check, Play, History, Maximize2, MoreVertical, Pen, Trash2, Edit, Sparkles } from 'lucide-react'
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { useTranslations } from 'next-intl'
import { useCreationStore } from '../store/creationStore'
import { AvatarLook } from '../types/avatar'
import Image from 'next/image'
import { Button } from './ui/button'
import { PreviewModal } from './modal/preview-avatar'
import { ImageModal } from './modal/image-modal'
import { useState, useRef, useCallback } from 'react'
import { formatDistanceToNow, Locale } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Avatar as UIAvatar, AvatarFallback } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import { cn } from '../lib/utils'
import { basicApiPatchCall, basicApiCall } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { useLookToDeleteStore } from '../store/lookToDelete'
import { useAvatarsStore } from '../store/avatarsStore'
import { Avatar } from '../types/avatar'

export const IconGenderMaleFemale: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
    <path d="M17.58 4H14V2h7v7h-2V5.41l-3.83 3.83A5 5 0 0112 16.9V19h2v2h-2v2h-2v-2H8v-2h2v-2.1A5 5 0 016 12a5 5 0 015-5c1 0 1.96.3 2.75.83L17.58 4M11 9a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z" />
  </svg>
);

export const IconGenderMale: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" height="1em" width="1em" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12.189 7l.002-2 7 .007-.008 7-2-.002.004-3.588-3.044 3.044a5.002 5.002 0 01-7.679 6.336 5 5 0 016.25-7.736l3.058-3.057L12.189 7zm-4.31 5.14a3 3 0 114.242 4.244A3 3 0 017.88 12.14z"
      clipRule="evenodd"
    />
  </svg>
);

export const IconGenderFemale: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" height="1em" width="1em" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 3a5 5 0 00-1 9.9V15H8v2h3v4h2v-4h3v-2h-3v-2.1A5.002 5.002 0 0012 3zM9 8a3 3 0 106 0 3 3 0 00-6 0z"
      clipRule="evenodd"
    />
  </svg>
);

interface AvatarLookCardProps {
  look: AvatarLook
  avatarName: String
  avatarId?: string
  isLastUsed?: boolean
  selectedLook?: AvatarLook | null
  onLookChange?: (look: AvatarLook | null) => void
  onAvatarNameChange?: (name: string | null) => void
  setIsModalConfirmDeleteOpen?: (isOpen: boolean) => void
  isPublic?: boolean
  onLookRenamed?: (lookId: string, newName: string) => void
  canEdit?: boolean
  onEditLook?: (look: AvatarLook) => void
}

export function AvatarLookCard({ 
  look, 
  avatarName, 
  avatarId,
  isLastUsed,
  selectedLook: propSelectedLook,
  onLookChange,
  onAvatarNameChange,
  setIsModalConfirmDeleteOpen,
  isPublic = false,
  onLookRenamed,
  canEdit = false,
  onEditLook
}: AvatarLookCardProps) {
  const { selectedLook: storeSelectedLook, setSelectedLook: setStoreSelectedLook, setSelectedAvatarName: setStoreSelectedAvatarName } = useCreationStore()
  const { activeSpace } = useActiveSpaceStore()
  const { data: session } = useSession()
  const { toast } = useToast()
  const { setLook } = useLookToDeleteStore()
  const { setAvatars, avatarsBySpace } = useAvatarsStore()
  const t = useTranslations('avatars')

  // États pour le dropdown et l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(look.name || '');
  const [displayName, setDisplayName] = useState(look.name || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const selectedLook = propSelectedLook !== undefined ? propSelectedLook : storeSelectedLook
  const isSelected = selectedLook?.id === look.id;
  const isProcessing = look.status === 'pending';

  // Resolve creator from activeSpace.members using look.createdBy userId
  const getCreator = () => {
    if (isPublic) {
      return { id: '', name: 'Hoox', image: '' };
    }
    if (look?.createdBy && activeSpace?.members) {
      const found = activeSpace.members.find(m => m.id === look.createdBy);
      if (found) return found;
    }
    if (activeSpace?.members && activeSpace.members.length > 0) {
      return activeSpace.members[0] || { id: '', name: '', image: '' };
    }
    return { id: '', name: 'API', image: '' };
  };

  const creator = getCreator();

  const handleClick = () => {
    if (!look.thumbnail || look.status === 'error' || isProcessing) return;
    if (onLookChange) {
      onLookChange(look)
    } else {
      setStoreSelectedLook(look)
    }
    
    if (onAvatarNameChange) {
      onAvatarNameChange(avatarName as string)
    } else {
      setStoreSelectedAvatarName(avatarName)
    }
  }

  const handleDelete = (e: any) => {
    e.stopPropagation()
    setLook(look)
    if (setIsModalConfirmDeleteOpen) {
      setIsModalConfirmDeleteOpen(true)
    }
    setIsDropdownOpen(false)
  }

  const startEditing = useCallback(() => {
    if (!canEdit) return;
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  }, []);

  const handleNameSave = useCallback(async () => {
    setIsEditing(false);
    if (editedName !== look.name) {
      try {
        if (!activeSpace?.id || !avatarId || !look.id) throw new Error('Missing identifiers');
        // Optimistic UI update
        const trimmed = editedName.trim();
        setDisplayName(trimmed);
        await basicApiPatchCall(`/space/${activeSpace.id}/avatars/${avatarId}/looks/${look.id}/rename`, {
          name: editedName.trim()
        })
        setDisplayName(trimmed)
        if (onLookRenamed && look.id) {
          onLookRenamed(look.id, trimmed)
        }
        toast({
          title: t('toast.name-updated'),
          description: t('toast.description-updated'),
          variant: "confirm",
        });
      } catch (error) {
        console.error(t('toast.error-message'), error);
        setEditedName(look.name || '');
        setDisplayName(look.name || '');
      }
    }
  }, [editedName, look, t, toast, activeSpace?.id, avatarId, onLookRenamed]);

  const handleUpscale = useCallback(async (e: any) => {
    e.stopPropagation();
    if (!activeSpace?.id || !avatarId || !look.id) return;
    
    setIsDropdownOpen(false);

    // Mise à jour optimiste du statut dans le store
    const currentAvatars = avatarsBySpace.get(activeSpace.id) || [];
    const updatedAvatars = currentAvatars.map((a: Avatar) => {
      if (a.id === avatarId) {
        return {
          ...a,
          looks: a.looks.map((l) => 
            l.id === look.id 
              ? { ...l, status: 'pending' as const }
              : l
          )
        };
      }
      return a;
    });
    setAvatars(activeSpace.id, updatedAvatars);

    try {
      await basicApiCall(`/space/${activeSpace.id}/avatars/${avatarId}/looks/${look.id}/upscale`, {});
      toast({
        title: t('toast.upscale-started'),
        description: t('toast.upscale-started-description'),
        variant: "confirm",
      });
    } catch (error) {
      console.error('Error starting upscale:', error);
      
      // Rollback en cas d'erreur
      setAvatars(activeSpace.id, currentAvatars);
      
      toast({
        title: t('toast.error-title'),
        description: t('toast.upscale-error'),
        variant: "destructive",
      });
    }
  }, [activeSpace?.id, avatarId, look.id, t, toast, avatarsBySpace, setAvatars]);

  return (
    <Card 
      className={`group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={handleClick}
      aria-disabled={!look.thumbnail}
    >
      {/* Tags superposés en haut à gauche */}
      {look.tags && look.tags.length > 0 && (
        <div className="absolute top-3 left-3 z-20 flex gap-2 group/tags">
          <Badge 
            variant="secondary" 
            className="bg-white/70 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm"
          >
            {t(`tags.${look.tags[0]}`)}
          </Badge>
          {look.tags.length > 1 && (
            <Badge 
              variant="secondary" 
              className="bg-white/70 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm"
            >
              +{look.tags.length - 1}
            </Badge>
          )}

          {/* Tooltip avec tous les tags au hover des tags uniquement */}
          {look.tags.length > 1 && (
            <div className="absolute top-full left-0 z-30 opacity-0 group-hover/tags:opacity-100 transition-opacity duration-200 pointer-events-none mt-1">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
                <div className="flex flex-wrap gap-2 max-w-64">
                  {look.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-white/70 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm whitespace-nowrap"
                    >
                      {t(`tags.${tag}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Icône de sélection et dropdown en haut à droite */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
        {(isSelected || isLastUsed) && (
          <>
            {isSelected ? (
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            ) : (
              <div className="bg-white/90 text-gray-600 rounded-full p-1 backdrop-blur-sm">
                <History className="h-4 w-4" />
              </div>
            )}
          </>
        )}
        {!isPublic && canEdit && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical style={{ width: '12px', height: '12px' }} />
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
                  <UIAvatar className="h-8 w-8 rounded-lg">
                    {creator.image && <AvatarImage src={creator.image} alt={creator.name ?? ''} />}
                    <AvatarFallback className="rounded-lg">{creator.name?.charAt(0) ?? 'A'}</AvatarFallback>
                  </UIAvatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{creator.name || 'API'}</span>
                    {!isPublic && (
                      <span className="truncate text-xs">
                        {look.createdAt ? new Date(look.createdAt).toLocaleDateString() : ''}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {onEditLook && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditLook(look);
                    }}
                  >
                    <Edit />
                    {t('dropdown-menu.edit')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing();
                  }}
                >
                  <Pen />
                  {t('dropdown-menu.rename')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleUpscale}
                  disabled={isProcessing || !look.thumbnail}
                >
                  <Sparkles />
                  {t('dropdown-menu.upscale')}
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
        )}
      </div>

      {/* Image principale */}
      <div className="w-full aspect-[3/4] relative">
        {look.thumbnail ? (
          <>
            <Image 
              src={look.thumbnail} 
              alt={look.name || ''}
              className="w-full h-full object-cover"
              width={1280}
              height={720}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]">
                {/* Effet de shimmer animé pour l'upscale */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full animate-pulse bg-muted flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          </div>
        )}

        {look.status === 'error' && (
          <div className="absolute inset-0 bg-red-600/60 backdrop-blur-[1px] flex items-center justify-center p-4">
            <span className="text-white text-xs sm:text-sm font-medium text-center">
              {t('look-error')}
            </span>
          </div>
        )}
      </div>

      {/* Bande d'information en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="w-[calc(100%-56px)] text-white font-semibold text-lg border-0 border-b border-b-white/50 focus:outline-none focus:ring-0 bg-transparent align-baseline leading-tight"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <h3 
                className="text-white font-semibold text-lg truncate align-baseline leading-tight" 
                onClick={(e) => { if (!canEdit) return; e.stopPropagation(); setIsEditing(true); }}
              >
                {displayName}
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* Bouton preview en bas à droite */}
      <div className="absolute bottom-4 right-3 z-10">
        {look.previewUrl && look.status !== 'error' ? (
          <PreviewModal previewUrl={look.previewUrl} avatarName={selectedLook?.name || ''} lookPlace={t(`place.${look.place}`)}>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
            >
              <Play style={{ width: '12px', height: '12px' }} />
            </Button>
          </PreviewModal>
        ) : look.thumbnail && look.status !== 'error' ? (
          <ImageModal imageUrl={look.thumbnail} title={look.name || ''}>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
            >
              <Maximize2 style={{ width: '12px', height: '12px' }} />
            </Button>
          </ImageModal>
        ) : null}
      </div>
    </Card>
  )
}
