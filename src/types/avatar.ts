export type Avatar = {
    id: string
    createdBy?: {
        userId?: string
        name?: string
        image?: string
    }
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

export type AvatarLook = {
    id?: string
    name?: string
    place?: string
    tags?: string[]
    thumbnail?: string
    previewUrl?: string
    videoUrl?: string
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