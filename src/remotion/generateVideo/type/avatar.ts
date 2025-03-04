export type AvatarLook = {
    id: string
    name: string
    place: string
    tags: string[]
    thumbnail: string
    previewUrl: string
	videoUrl?: string
	settings?: {
		position: number  // Position horizontale (en pourcentage)
		verticalPosition?: number  // Position verticale (en pourcentage)
	}
}