export type AvatarRender = {
    audioIndex: number
    startInFrames: number
    durationInSeconds?: number
    url: string
}

export type AvatarLook = {
    id: string
    name: string
    place: string
    tags: string[]
    thumbnail: string
    previewUrl: string
	videoUrl?: string
	renders?: AvatarRender[]
	settings?: {
		position: number  // Position horizontale (en pourcentage)
		verticalPosition?: number  // Position verticale (en pourcentage)
	}
}