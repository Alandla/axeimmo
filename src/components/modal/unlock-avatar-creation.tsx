'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Check } from 'lucide-react'

interface UnlockAvatarCreationModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function UnlockAvatarCreationModal({ isOpen, setIsOpen }: UnlockAvatarCreationModalProps) {
  const t = useTranslations('avatars')


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-5xl md:h-[85vh] p-0 border-0 overflow-hidden rounded-xl"
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left content */}
          <div className="p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">{t('unlock-title')}</h2>
            <p className="text-muted-foreground mb-6">{t('unlock-description')}</p>

            <div className="space-y-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-green-100 text-green-700 p-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-sm md:text-base">{t(`unlock.features.${i}`)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full h-12 text-base" onClick={() => setIsOpen(false)}>
                {t('unlock.see-in-action')}
              </Button>
              <Button asChild className="w-full h-12 text-base">
                <Link href="/dashboard/pricing" target="_blank" rel="noopener noreferrer">
                  {t('unlock.upgrade')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right visual placeholder */}
          <div className="hidden md:block relative bg-gray-100 h-full max-h-[85vh] overflow-hidden">
            {/* Placeholder image; can be replaced by a video */}
            <img
              src="/img/style-previews/ugc.png"
              alt="Unlock avatar"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


