export type Voice = {
    id: string
    name: string
    gender: 'male' | 'female'
    accent: string
    tags: string[]
    previewUrl: string
}