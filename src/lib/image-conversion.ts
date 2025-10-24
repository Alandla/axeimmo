import sharp from 'sharp'
import { uploadToS3Image } from '@/src/lib/r2'

function isAvifByExtension(url: string): boolean {
  try {
    const u = new URL(url)
    return u.pathname.toLowerCase().endsWith('.avif')
  } catch {
    return url.toLowerCase().includes('.avif')
  }
}

async function isAvifByContentType(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    const ct = head.headers.get('content-type') || ''
    return ct.toLowerCase().includes('image/avif')
  } catch {
    return false
  }
}

export async function ensureJpegUrl(imageUrl: string): Promise<string> {
  const avif = isAvifByExtension(imageUrl) || await isAvifByContentType(imageUrl)
  if (!avif) return imageUrl

  const res = await fetch(imageUrl)
  if (!res.ok) return imageUrl

  const arrayBuffer = await res.arrayBuffer()
  const input = Buffer.from(arrayBuffer)

  const jpegBuffer = await sharp(input).jpeg({ quality: 90 }).toBuffer()

  const fileName = `image-${Date.now()}`
  const { url } = await uploadToS3Image(jpegBuffer, 'medias-users', fileName, 'jpg', 'image/jpeg')
  return url
}

/**
 * Force convert any image to JPEG format
 * Useful when an image format is not supported by external services
 */
export async function convertToJpeg(imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.statusText}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const input = Buffer.from(arrayBuffer)

    const jpegBuffer = await sharp(input).jpeg({ quality: 90 }).toBuffer()

    const fileName = `converted-${Date.now()}`
    const { url } = await uploadToS3Image(jpegBuffer, 'medias-users', fileName, 'jpg', 'image/jpeg')
    
    console.log(`Successfully converted image to JPEG: ${imageUrl} -> ${url}`)
    return url
  } catch (error) {
    console.error('Error converting image to JPEG:', error)
    throw error
  }
}


