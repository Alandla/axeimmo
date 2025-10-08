export type Avatar = {
    id: string
    name: string
    age: string,
    gender: 'male' | 'female'
    tags: string[]
    thumbnail: string
    premium?: boolean
    looks: AvatarLook[]
    look_ids?: string[] // IDs des looks pour une recherche rapide
}

export type AvatarRender = {
    audioIndex: number
    startInFrames: number
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
    renders?: AvatarRender[]
    format?: 'vertical' | 'horizontal'
    settings?: {
        heygenType?: 'avatar' | 'talking_photo'
		position?: number  // Position horizontale (en pourcentage)
		verticalPosition?: number  // Position verticale (en pourcentage)
		scale?: number  // Échelle de l'avatar (prend le dessus sur la valeur par défaut)
	}
}