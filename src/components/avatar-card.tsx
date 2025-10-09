'use client'

import { Check, History, Users, MoreVertical, Pen, Edit, Trash2, Eye } from 'lucide-react'
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { useTranslations } from 'next-intl'
import { useCreationStore } from '../store/creationStore'
import { Avatar } from '../types/avatar'
import Image from 'next/image'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { PlanName } from '../types/enums'
import { usePremiumToast } from '@/src/utils/premium-toast'
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
import { Button } from "@/src/components/ui/button"
import { Avatar as UIAvatar, AvatarFallback } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import { cn } from '../lib/utils'
import { basicApiCall } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { useAvatarToDeleteStore } from '../store/avatarToDelete'

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

interface AvatarCardProps {
  avatar: Avatar;
  onClick: () => void;
  isLastUsed?: boolean;
  selectedAvatarName?: string | String | null;
  disabled?: boolean;
  setIsModalConfirmDeleteOpen?: (isOpen: boolean) => void;
  onSeeLooks?: (avatar: Avatar) => void;
  isPublic?: boolean;
}

export function AvatarCard({ 
  avatar, 
  onClick, 
  isLastUsed, 
  selectedAvatarName: propSelectedAvatarName, 
  disabled = false,
  setIsModalConfirmDeleteOpen,
  onSeeLooks,
  isPublic = false
}: AvatarCardProps) {
    const { selectedAvatarName: storeSelectedAvatarName } = useCreationStore()
    const { activeSpace } = useActiveSpaceStore()
    const { showPremiumToast } = usePremiumToast()
    const t = useTranslations('avatars')
    const pricingT = useTranslations('pricing')
    const { data: session } = useSession()
    const { toast } = useToast()
    const { setAvatar } = useAvatarToDeleteStore()
    
    // États pour le dropdown et l'édition
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(avatar.name);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Utiliser la prop si fournie, sinon utiliser le store
    const selectedAvatarName = propSelectedAvatarName !== undefined ? propSelectedAvatarName : storeSelectedAvatarName
    const isSelected = selectedAvatarName === avatar.name;

    // Récupérer les informations du créateur depuis activeSpace.members
    const getCreator = () => {
      if (isPublic) {
        return { id: '', name: 'Hoox', image: '' };
      }
      // Pour l'instant, on utilise le premier membre disponible ou on retourne des valeurs par défaut
      // TODO: Ajouter un système d'historique pour les avatars
      if (activeSpace?.members && activeSpace.members.length > 0) {
        return activeSpace.members[0] || { id: '', name: '', image: '' };
      }
      return { id: '', name: 'API', image: '' };
    };

    const creator = getCreator();

    const handleAvatarSelection = () => {
      if (disabled) return;
      if (!avatar.thumbnail) return;
      if (avatar.premium && activeSpace?.planName === PlanName.FREE) {
        showPremiumToast(
          t('toast.title-error'),
          t('toast.description-premium-error', { plan: 'Pro' }),
          pricingT('upgrade')
        );
        return
      }
      onClick()
    }

    const handleDelete = (e: any) => {
      e.stopPropagation()
      setAvatar(avatar)
      if (setIsModalConfirmDeleteOpen) {
        setIsModalConfirmDeleteOpen(true)
      }
      setIsDropdownOpen(false)
    }

    const startEditing = useCallback(() => {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }, []);

    const handleNameSave = useCallback(async () => {
      setIsEditing(false);
      if (editedName !== avatar.name) {
        try {
          avatar.name = editedName;
          await basicApiCall('/avatar/save', {
            avatar: {
              id: avatar.id,
              name: editedName
            }
          });
          toast({
            title: t('toast.name-updated'),
            description: t('toast.description-updated'),
            variant: "confirm",
          });
        } catch (error) {
          console.error(t('toast.error-message'), error);
          setEditedName(avatar.name); // Restaurer l'ancien nom en cas d'erreur
        }
      }
    }, [editedName, avatar, t, toast]);

    const handleSeeLooks = useCallback((e: any) => {
      e.stopPropagation()
      if (onSeeLooks) {
        onSeeLooks(avatar)
      }
      setIsDropdownOpen(false)
    }, [onSeeLooks, avatar])

  return (
    <Card 
      key={avatar.id} 
      className={`group relative overflow-hidden rounded-lg ${disabled ? 'cursor-not-allowed opacity-70' : (avatar.thumbnail ? 'cursor-pointer' : 'cursor-not-allowed opacity-70')} transition-all duration-150 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={handleAvatarSelection}
      aria-disabled={disabled || !avatar.thumbnail}
    >
      {/* Tags superposés en haut à gauche */}
      <div className="absolute top-3 left-3 z-20 flex gap-2 group/tags">
        {avatar.tags.length > 0 && (
          <Badge 
            variant="secondary" 
            className="bg-white/70 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm"
          >
            {t(`tags.${avatar.tags[0]}`)}
          </Badge>
        )}
        {avatar.tags.length > 1 && (
          <Badge 
            variant="secondary" 
            className="bg-white/70 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm"
          >
            +{avatar.tags.length - 1}
          </Badge>
        )}
        {avatar.premium && (
          <Badge variant="plan" className="text-xs px-2 py-1">
            Pro
          </Badge>
        )}

        {/* Tooltip avec tous les tags au hover des tags uniquement */}
        {avatar.tags.length > 1 && (
          <div className="absolute top-full left-0 z-30 opacity-0 group-hover/tags:opacity-100 transition-opacity duration-200 pointer-events-none mt-1">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
              <div className="flex flex-wrap gap-2 max-w-64">
                {avatar.tags.map((tag, index) => (
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
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
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
                          {avatar.createdAt ? new Date(avatar.createdAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={handleSeeLooks}
                  >
                    <Eye />
                    {t('dropdown-menu.see-looks')}
                  </DropdownMenuItem>
                  {!isPublic && (
                    <>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing();
                        }}
                      >
                        <Pen />
                        {t('dropdown-menu.rename')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
                {!isPublic && (
                  <>
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
                  </>
                )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image principale */}
      <div className="w-full aspect-[3/4] relative">
        {avatar.thumbnail ? (
          <>
            <Image 
              src={avatar.thumbnail} 
              alt={avatar.name}
              className="w-full h-full object-cover"
              width={1280}
              height={720}
            />
            {!disabled && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
                <Eye className="text-white w-8 h-8" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full animate-pulse bg-muted flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Bande d'information en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-baseline justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="w-full text-white font-semibold text-lg border-0 border-b border-b-white/50 focus:outline-none focus:ring-0 bg-transparent"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <h3 
                className="text-white font-semibold text-lg truncate cursor-text" 
                onClick={() => setIsEditing(true)}
              >
                {avatar.name}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white text-sm font-medium">{avatar.looks.length}</span>
            <Users className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
    </Card>
  )
}
