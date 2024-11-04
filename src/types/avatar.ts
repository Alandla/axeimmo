export type Avatar = {
    id: string
    name: string
    age: string,
    gender: 'male' | 'female'
    tags: string[]
    thumbnail: string
    looks: AvatarLook[]
}

export type AvatarLook = {
    id: string
    name: string
    place: string
    tags: string[]
    thumbnail: string
    previewUrl: string
}