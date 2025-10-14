export type Avatar = {
    id: string
    createdBy?: string
    name: string
    age: string,
    gender: 'male' | 'female'
    tags: string[]
    thumbnail: string
    premium?: boolean
    looks: AvatarLook[]
    look_ids?: string[] // IDs des looks pour une recherche rapide
    createdAt?: string
}

export type AvatarStyle = 'ugc-realist' | 'studio' | 'podcast'
export type AvatarRender = {
    audioIndex: number
    startInFrames: number
    durationInSeconds?: number
    url: string
}

export type AvatarLook = {
    id?: string
    name?: string
    place?: string
    tags?: string[]
    thumbnail?: string
    previewUrl?: string
    videoUrl?: string
    createdBy?: string
    renders?: AvatarRender[]
    format?: 'vertical' | 'horizontal'
    status?: 'pending' | 'ready' | 'error'
    errorMessage?: string
    errorAt?: string
    createdAt?: string
    settings?: {
        heygenType?: 'avatar' | 'talking_photo'
		position?: number  // Position horizontale (en pourcentage)
		verticalPosition?: number  // Position verticale (en pourcentage)
		scale?: number  // Échelle de l'avatar (prend le dessus sur la valeur par défaut)
	}
}