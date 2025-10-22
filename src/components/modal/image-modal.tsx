import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"
import Image from 'next/image'
import { useState } from 'react'
import { getImageDimensions } from "@/src/service/upload.service"

interface ImageModalProps {
  imageUrl: string
  title: string
  children: React.ReactNode
}

export function ImageModal({ imageUrl, title, children }: ImageModalProps) {
  const [open, setOpen] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null)

  const handleOpenChange = async (value: boolean) => {
    setOpen(value)
    if (value && imageUrl) {
      const dimensions = await getImageDimensions(imageUrl)
      setImageDimensions(dimensions)
    } else {
      setImageDimensions(null)
    }
  }

  const getImageSize = () => {
    if (!imageDimensions) return { width: 0, height: 0 }
    
    const { width, height } = imageDimensions
    const aspectRatio = width / height
    const maxWidth = window.innerWidth * 0.85
    const maxHeight = window.innerHeight * 0.85
    
    let displayWidth = maxWidth
    let displayHeight = maxWidth / aspectRatio
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = maxHeight * aspectRatio
    }
    
    return { width: Math.round(displayWidth), height: Math.round(displayHeight) }
  }

  const imageSize = getImageSize()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col bg-black/50 border-none shadow-none p-0 w-auto h-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
          setOpen(false)
        }}
      >
        <div 
          className="flex items-center justify-center cursor-pointer"
          onClick={() => setOpen(false)}
        >
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Image 
              src={imageUrl} 
              alt={title}
              width={imageSize.width}
              height={imageSize.height}
              className="object-contain"
              sizes="85vw"
              quality={100}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
