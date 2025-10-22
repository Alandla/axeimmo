export type AvatarStyleKey = 'selfie' | 'studio' | 'podcast' | 'srpo-car' | 'iphone'

export interface AvatarStyleConfig {
  key: AvatarStyleKey
  previewImage: string
  falEndpoint?: string
  loraUrl?: string
  falEndpointHorizontal?: string
}

export const AVATAR_STYLES: Record<AvatarStyleKey, AvatarStyleConfig> = {
  'iphone': {
    key: 'iphone',
    previewImage: '/img/style-previews/iphone.png',
    falEndpoint: 'comfy/Hoox/srpo-lora-as-input',
    falEndpointHorizontal: 'comfy/Hoox/srpo-lora-as-input-horizontal',
    loraUrl: 'https://v3b.fal.media/files/b/penguin/0rsSCMgEHhT0O_oFJR-wR_pytorch_lora_weights.safetensors'
  },
  'selfie': {
    key: 'selfie',
    previewImage: '/img/style-previews/ugc.png',
    falEndpoint: 'comfy/Hoox/srpo-lora-as-input',
    falEndpointHorizontal: 'comfy/Hoox/srpo-lora-as-input-horizontal',
    loraUrl: 'https://v3b.fal.media/files/b/penguin/F9OYhy9pgx5pr2muQf0pF_pytorch_lora_weights.safetensors'
  },
  'studio': {
    key: 'studio',
    previewImage: '/img/style-previews/studio.png',
    falEndpoint: 'fal-ai/flux/srpo'
  },
  'podcast': {
    key: 'podcast',
    previewImage: '/img/style-previews/podcast.png',
    falEndpoint: 'comfy/Hoox/srpo-lora-as-input',
    falEndpointHorizontal: 'comfy/Hoox/srpo-lora-as-input-horizontal',
    loraUrl: 'https://v3b.fal.media/files/b/monkey/A8oAzNaOAFeepy1vcSb7p_pytorch_lora_weights.safetensors'
  },
  'srpo-car': {
    key: 'srpo-car',
    previewImage: '/img/style-previews/car.png',
    falEndpoint: 'comfy/Hoox/srpo-lora-as-input',
    falEndpointHorizontal: 'comfy/Hoox/srpo-lora-as-input-horizontal',
    loraUrl: 'https://v3b.fal.media/files/b/kangaroo/KDPcdaZMAZUb7SILyLcwe_pytorch_lora_weights.safetensors'
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

