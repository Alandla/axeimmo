'use client'

import { Check, History } from 'lucide-react'
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { useTranslations } from 'next-intl'
import { useCreationStore } from '../store/creationStore'
import { Avatar } from '../types/avatar'
import Image from 'next/image'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { PlanName } from '../types/enums'
import { usePremiumToast } from '@/src/utils/premium-toast'

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
}

export function AvatarCard({ avatar, onClick, isLastUsed, selectedAvatarName: propSelectedAvatarName, disabled = false }: AvatarCardProps) {
    const { selectedAvatarName: storeSelectedAvatarName } = useCreationStore()
    const { activeSpace } = useActiveSpaceStore()
    const { showPremiumToast } = usePremiumToast()
    const t = useTranslations('avatars')
    const pricingT = useTranslations('pricing')
    
    // Utiliser la prop si fournie, sinon utiliser le store
    const selectedAvatarName = propSelectedAvatarName !== undefined ? propSelectedAvatarName : storeSelectedAvatarName
    const isSelected = selectedAvatarName === avatar.name;

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

  return (
    <Card 
      key={avatar.id} 
      className={`flex flex-col relative ${disabled ? 'cursor-not-allowed opacity-70' : (avatar.thumbnail ? 'cursor-pointer' : 'cursor-not-allowed opacity-70')} transition-all duration-150 ${isSelected ? 'border-primary border' : ''}`}
      onClick={handleAvatarSelection}
      aria-disabled={disabled || !avatar.thumbnail}
    >
      {(isSelected || isLastUsed) && (
        <div className="absolute top-2 right-2 transition-all duration-150">
          {isSelected ? (
            <Check className="h-5 w-5 text-primary" />
          ) : (
            <History className="h-5 w-5 text-gray-400" />
          )}
        </div>
      )}
      <CardContent className="flex flex-col justify-between p-4 h-full">
        <div>
          <div className="flex items-center mb-2">
            {avatar.gender === 'male' ? (
              <IconGenderMale className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <IconGenderFemale className="h-5 w-5 mr-2 text-pink-500" />
            )}
            <h3 className="text-lg font-semibold">{avatar.name}</h3>
            {avatar.premium && (
              <Badge variant="plan" className="ml-2">
                Pro
              </Badge>
            )}
          </div>
          <div 
            className="mb-4 overflow-x-auto scrollbar-hide"
            onWheel={(e) => {
              e.preventDefault();
              e.currentTarget.scrollLeft += e.deltaY;
            }}
          >
            <div className="flex gap-1 min-w-min">
              <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
                {avatar.looks.length} Looks
              </Badge>
              {avatar.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="shrink-0 whitespace-nowrap">
                  {t(`tags.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="w-full aspect-square rounded-md overflow-hidden">
            {avatar.thumbnail ? (
              <Image 
                src={avatar.thumbnail} 
                alt={avatar.name}
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
        </div>
      </CardContent>
    </Card>
  )
}
