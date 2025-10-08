'use client'

import { Check, Play, History } from 'lucide-react'
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { useTranslations } from 'next-intl'
import { useCreationStore } from '../store/creationStore'
import { AvatarLook } from '../types/avatar'
import Image from 'next/image'
import { Button } from './ui/button'
import { PreviewModal } from './modal/preview-avatar'

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
  isLastUsed?: boolean
  selectedLook?: AvatarLook | null
  onLookChange?: (look: AvatarLook | null) => void
  onAvatarNameChange?: (name: string | null) => void
}

export function AvatarLookCard({ 
  look, 
  avatarName, 
  isLastUsed,
  selectedLook: propSelectedLook,
  onLookChange,
  onAvatarNameChange
}: AvatarLookCardProps) {
  const { selectedLook: storeSelectedLook, setSelectedLook: setStoreSelectedLook, setSelectedAvatarName: setStoreSelectedAvatarName } = useCreationStore()
  const t = useTranslations('avatars')

  const selectedLook = propSelectedLook !== undefined ? propSelectedLook : storeSelectedLook
  const isSelected = selectedLook?.id === look.id;

  const handleClick = () => {
    if (!look.thumbnail) return;
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

  return (
    <Card 
      className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={handleClick}
      aria-disabled={!look.thumbnail}
    >
      {/* Tags superposés en haut à gauche */}
      {look.tags && look.tags.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {look.tags.slice(0, 2).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="bg-white/90 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm"
            >
              {t(`tags.${tag}`)}
            </Badge>
          ))}
        </div>
      )}

      {/* Icône de sélection en haut à droite */}
      {(isSelected || isLastUsed) && (
        <div className="absolute top-3 right-3 z-10">
          {isSelected ? (
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="bg-white/90 text-gray-600 rounded-full p-1 backdrop-blur-sm">
              <History className="h-4 w-4" />
            </div>
          )}
        </div>
      )}

      {/* Image principale */}
      <div className="w-full aspect-[3/4] relative">
        {look.thumbnail ? (
          <Image 
            src={look.thumbnail} 
            alt={look.name || ''}
            className="w-full h-full object-cover"
            width={1280}
            height={720}
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-muted flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Bande d'information en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">{look.name}</h3>
        </div>
      </div>

      {/* Bouton preview en bas à droite */}
      {look.previewUrl && (
        <div className="absolute bottom-3 right-3 z-10">
          <PreviewModal previewUrl={look.previewUrl} avatarName={selectedLook?.name || ''} lookPlace={t(`place.${look.place}`)}>
            <Button
              variant="outline"
              size="icon"
              className="bg-white/90 text-gray-800 hover:bg-white border-white/20 h-8 w-8"
            >
              <Play className="h-4 w-4" />
            </Button>
          </PreviewModal>
        </div>
      )}
    </Card>
  )
}
