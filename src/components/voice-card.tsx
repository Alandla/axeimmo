'use client'

import { Play, Pause, Check, Rocket } from 'lucide-react'
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { accentFlags } from '../config/voices.config'
import { useTranslations } from 'next-intl'
import { Voice } from '../types/voice'
import { useCreationStore } from '../store/creationStore'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { PlanName } from '../types/enums'
import { useToast } from '../hooks/use-toast'
import Link from 'next/link'

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

export function VoiceCard({ voice, playingVoice, onPreviewVoice }: { voice: Voice, playingVoice: {voice: Voice | null, audio: HTMLAudioElement | null}, onPreviewVoice: (voice: Voice) => void }) {
    const { selectedVoice, setSelectedVoice } = useCreationStore()
    const { activeSpace } = useActiveSpaceStore()
    const { toast } = useToast()
    const t = useTranslations('voices')
    const pricingT = useTranslations('pricing')
    const planT = useTranslations('plan')
    const isSelected = selectedVoice?.id === voice.id;
    
    const handleVoiceSelection = () => {
      if ((voice.plan === PlanName.PRO && activeSpace?.planName !== PlanName.PRO && activeSpace?.planName !== PlanName.ENTREPRISE) || (voice.plan === PlanName.ENTREPRISE && activeSpace?.planName !== PlanName.ENTREPRISE)) {
        toast({
          variant: "premium",
          title: t('toast.title-error'),
          description: t('toast.description-premium-error', { plan: planT(voice.plan) }),
          action: (
            <Link href="/dashboard/pricing" target="_blank">
              <Button variant="outline" className="border-[#FB5688] text-[#FB5688] hover:bg-[#FB5688] hover:text-white mt-2 w-full">
                <Rocket className="h-4 w-4" />
                {pricingT('upgrade')}
              </Button>
            </Link>
          )
        })
        return
      }
      setSelectedVoice(voice)
    }

  return (
    <Card 
      key={voice.id} 
      className={`flex flex-col relative cursor-pointer transition-all duration-150 ${isSelected ? 'border-primary border' : ''}`} 
      onClick={handleVoiceSelection}
    >
      {isSelected && (
        <div className="absolute top-4 right-2 transition-all duration-150">
          <Check className="h-5 w-5 text-primary" />
        </div>
      )}
      <CardContent className="flex flex-col justify-between p-4 h-full">
        <div>
          <div className="flex items-center mb-2">
            {voice.gender === 'male' ? (
              <IconGenderMale className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <IconGenderFemale className="h-5 w-5 mr-2 text-pink-500" />
            )}
            <h3 className="text-lg font-semibold">{voice.name}</h3>
            {(voice.plan === PlanName.ENTREPRISE || voice.plan === PlanName.PRO) && (
              <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-[#FB5688] to-[#9C2779] text-white text-xs border-none shadow-sm font-semibold">
                {planT(voice.plan)}
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
              <Badge variant="secondary" className="shrink-0">
                {accentFlags[voice.accent]}
              </Badge>
              {voice.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="shrink-0 whitespace-nowrap">
                  {t(`tags.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onPreviewVoice(voice);
          }}
        >
          {playingVoice.voice?.id === voice.id ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              {t('pause')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t('listen')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
