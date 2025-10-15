export type AvatarStyleKey = 'selfie' | 'studio' | 'podcast' | 'srpo-car'

export type AvatarStyleGenerationMethod = 'comfy-srpo' | 'comfy-srpo-podcast' | 'comfy-srpo-car' | 'flux-srpo'

export interface AvatarStyleConfig {
  key: AvatarStyleKey
  previewImage: string
  generationMethod: AvatarStyleGenerationMethod
  falEndpoint?: string
}

export const AVATAR_STYLES: Record<AvatarStyleKey, AvatarStyleConfig> = {
  'selfie': {
    key: 'selfie',
    previewImage: '/img/style-previews/ugc.png',
    generationMethod: 'comfy-srpo',
    falEndpoint: 'comfy/Hoox/srpo-selfie-o5-no-style-4k-step'
  },
  'studio': {
    key: 'studio',
    previewImage: '/img/style-previews/studio.png',
    generationMethod: 'flux-srpo',
    falEndpoint: 'fal-ai/flux/srpo'
  },
  'podcast': {
    key: 'podcast',
    previewImage: '/img/style-previews/podcast.png',
    generationMethod: 'comfy-srpo-podcast',
    falEndpoint: 'comfy/Hoox/srpo-podcast4k-steps'
  },
  'srpo-car': {
    key: 'srpo-car',
    previewImage: '/img/style-previews/car.png',
    generationMethod: 'comfy-srpo-car',
    falEndpoint: 'comfy/Hoox/srpo-car'
  }
} as const

export const getAvatarStyle = (styleKey: AvatarStyleKey): AvatarStyleConfig | undefined => {
  return AVATAR_STYLES[styleKey]
}

export const getAllAvatarStyles = (): AvatarStyleConfig[] => {
  return Object.values(AVATAR_STYLES)
}

export const getAvailableStyleKeys = (): AvatarStyleKey[] => {
  return Object.keys(AVATAR_STYLES) as AvatarStyleKey[]
}

