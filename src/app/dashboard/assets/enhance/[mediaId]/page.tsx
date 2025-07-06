'use client'

import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ImageToVideoEnhancer from '@/src/components/image-to-video-enhancer'

export default function EnhancePage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('assets')

  const handleBack = () => {
    router.push('/dashboard/assets')
  }

  const handleSuccess = () => {
    router.push('/dashboard/assets')
  }

  if (!params.mediaId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Média introuvable</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/assets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back-to-assets')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <ImageToVideoEnhancer
        mediaId={params.mediaId as string}
        onBack={handleBack}
        onSuccess={handleSuccess}
        isModal={false}
      />
    </div>
  )
} 