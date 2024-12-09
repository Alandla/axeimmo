export enum Genre {
    DRAMATIC = "Dramatic",
    INFORMATIVE = "Informative",
    ENTERTAINING = "Entertaining",
    INSPIRATIONAL = "Inspirational",
    HUMOROUS = "Humorous",
    EDUCATIONAL = "Educational",
    MYSTERIOUS = "Mysterious",
    RELAXING = "Relaxing",
}

export type Music = {
    name: string
    genre: Genre
    url: string
}