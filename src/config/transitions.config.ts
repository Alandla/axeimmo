import { ITransition } from "../types/video"

export const transitions : ITransition[] = [
    {
        durationInFrames: 98,
        video: "https://assets.hoox.video/Film%20Burn%20Red%20Burn.mp4",
        thumbnail: "https://assets.hoox.video/film-burn-red-thumbnail.png",
        fullAt: 14,
        category: "film-burn",
    },
    {
        durationInFrames: 30,
        video: "https://assets.hoox.video/Transition%20verte.mp4",
        thumbnail: "https://assets.hoox.video/transition-vert-thumbnail.png",
        fullAt: 17,
        category: "click",
    },
]

export const sounds = [
    {
        name: "Burn Fizzle",
        url: "https://assets.hoox.video/Film%20Burn%20Fizzle.wav",
        category: "film-burn",
    },
    {
        name: "Click 1",
        url: "https://assets.hoox.video/Clicks.mp3",
        category: "click",
    }
]