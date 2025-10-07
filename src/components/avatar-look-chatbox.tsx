'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, X } from 'lucide-react'
import { Avatar, AvatarLook } from '@/src/types/avatar'
import { basicApiCall } from '@/src/lib/api'
import { getMediaUrlFromFileByPresignedUrl } from '@/src/service/upload.service'
import { cn } from '@/src/lib/utils'

type Props = {
  anchorRef: React.RefObject<HTMLDivElement>
  activeAvatar: Avatar
  spaceId: string
  onRefresh: () => Promise<void> | void
}

const Thumbnails = React.memo(function Thumbnails({ urls, onRemove }: { urls: string[]; onRemove: (index: number) => void }) {
  return (
    <div className="flex items-center gap-2 h-10">
      {urls.map((url, idx) => (
        <div key={`${url}-${idx}`} className="relative h-10 w-10 flex-shrink-0">
          <img src={url} alt="preview" className="h-10 w-10 object-cover rounded-md border" />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border shadow flex items-center justify-center"
            aria-label="remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
})

export function AvatarLookChatbox({ anchorRef, activeAvatar, spaceId, onRefresh }: Props) {
  const t = useTranslations('avatars')
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [referenceImage, setReferenceImage] = useState<string | null>(activeAvatar?.thumbnail || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const refButtonRef = useRef<HTMLButtonElement | null>(null)
  const [pickerCoords, setPickerCoords] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 })
  const [rect, setRect] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setReferenceImage(activeAvatar?.thumbnail || null)
  }, [activeAvatar?.id])

  // Positionnement calé sur l'anchor via ResizeObserver
  useEffect(() => {
    if (!anchorRef.current) return
    const el = anchorRef.current
    const update = () => {
      const r = el.getBoundingClientRect()
      setRect({ left: r.left, width: r.width })
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      obs.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [anchorRef])

  const candidateImages = useMemo(() => {
    const list = [
      ...(activeAvatar?.thumbnail ? [activeAvatar.thumbnail] : []),
      ...activeAvatar.looks.map((l: AvatarLook) => l.thumbnail).filter((u): u is string => !!u)
    ]
    return Array.from(new Set(list))
  }, [activeAvatar?.id, activeAvatar?.thumbnail, activeAvatar?.looks])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    const uploads: string[] = []
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const { mediaUrl } = await getMediaUrlFromFileByPresignedUrl(file)
        uploads.push(mediaUrl)
      }
      if (uploads.length > 0) setImages((prev) => [...prev, ...uploads])
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      await basicApiCall(`/space/${spaceId}/avatars/${activeAvatar.id}/looks/generate`, {
        description: prompt.trim(),
        images: [referenceImage, ...images].filter((u): u is string => !!u)
      })
      setPrompt('')
      setImages([])
      setPickerOpen(false)
      await onRefresh()
    } finally {
      setIsGenerating(false)
    }
  }

  const popupDims = useMemo(() => {
    const max = 960
    const width = Math.min(rect.width || max, max)
    const left = rect.left + Math.max((rect.width - width) / 2, 0)
    return { left, width }
  }, [rect.left, rect.width])

  return (
    <div className="fixed bottom-4 z-50" style={{ left: popupDims.left, width: popupDims.width }}>
      <div className="flex items-center gap-2 bg-white border rounded-xl p-2 shadow-md">
        <div className="flex items-center gap-2 pl-1">
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden h-10 flex-shrink-0">
            <div className="relative flex-shrink-0 h-10">
              {referenceImage && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md overflow-hidden border flex-shrink-0"
                  ref={refButtonRef}
                  onClick={() => {
                    const r = refButtonRef.current?.getBoundingClientRect()
                    if (r) {
                      setPickerCoords({ left: r.left, bottom: window.innerHeight - r.top + 8 })
                    }
                    setPickerOpen((v) => !v)
                  }}
                  title="Reference image"
                >
                  <img src={referenceImage} alt="ref" className="h-full w-full object-cover" />
                </button>
              )}
              {pickerOpen && (
                <div className="fixed bg-white border rounded-lg shadow-lg p-2 z-[1000] w-[220px]" style={{ left: pickerCoords.left, bottom: pickerCoords.bottom }}>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto">
                    {candidateImages.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={cn(
                          'h-16 w-16 rounded-md overflow-hidden border',
                          referenceImage === u && 'ring-2 ring-primary'
                        )}
                        onClick={() => { setReferenceImage(u); setPickerOpen(false) }}
                      >
                        <img src={u} alt="candidate" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Thumbnails urls={images} onRemove={removeImage} />
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`${t('look-chat.placeholder-1')} / ${t('look-chat.placeholder-2')}`}
            className="w-full"
          />
        </div>
        <Button
          disabled={isGenerating || isUploading || !prompt.trim()}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t('look-chat.sending')}</span>
          ) : isUploading ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t('common.loading')}</span>
          ) : (
            t('look-chat.send')
          )}
        </Button>
      </div>
      {/* thumbnails now shown inline in the bar */}
    </div>
  )
}

export default AvatarLookChatbox


