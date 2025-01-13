import { ISpaceSubtitleStyle } from "../types/space"

export const templates = [
    {
      name: "simple",
      optionsAvailable: [
        "border",
        "activeWord",
      ],
    },
    {
      name: "bold",
      optionsAvailable: [
        "shadow",
        "activeWord",
        "animation",
      ],
    },
    {
      name: "background",
      optionsAvailable: [
          "activeWord",
          "animation",
          "background",
          "border",
      ],
    },
    {
      name: "clean",
      optionsAvailable: [
        "activeWord",
        "animation",
        "background",
      ],
    },
    {
      name: "daniel",
      optionsAvailable: [
        "shadow",
      ],
    },
    {
      name: "modern",
      optionsAvailable: [
        "secondLine",
        "animation",
        "shadow",
      ],
    },
]

export const subtitles : ISpaceSubtitleStyle[] = [
    {
        id: '1',
        name: 'Simple',
        style: {
            template: 'simple',
            fontFamily: 'Arial',
            fontWeight: "500",
            fontSize: 60,
            color: "#ffffff",
            isBold: false,
            isItalic: false,
            isPunctuation: false,
            isUppercase: false,
            mode: 'twoLines',
            position: 75,
            activeWord: {
                isActive: false,
                fontFamily: 'Arial',
                fontWeight: "500",
                fontSize: 60,
                color: "#ffffff",
                isBold: false,
                isItalic: false,
                isUppercase: false,
            },
            border: {
                isActive: true,
                color: "#000000",
                size: 15
            }
        }
    },
    {
        id: '2',
        name: 'Bold',
        style: {
            template: 'bold',
            fontFamily: 'Montserrat',
            fontWeight: "800",
            fontSize: 60,
            color: "#ffffff",
            isItalic: false,
            isPunctuation: true,
            isUppercase: true,
            mode: 'twoLines',
            position: 50,
            animation: {
                appear: "bounce",
            },
            activeWord: {
                isActive: true,
                fontFamily: 'Montserrat',
                fontWeight: "800",
                fontSize: 62,
                color: "#bbbbbb",
                isItalic: false,
                isPunctuation: true,
                isUppercase: true,
            },
            shadow: {
                isActive: true,
                size: 3,
                color: "#000000",
            },
        }
    },
    {
        id: '3',
        name: 'Background',
        style: {
            template: 'background',
            fontFamily: 'Montserrat',
            fontWeight: "800",
            fontSize: 60,
            color: "#ffffff",
            isItalic: false,
            isPunctuation: true,
            isUppercase: true,
            mode: 'twoLines',
            position: 50,
            animation: {
                appear: "bounce",
            },
            activeWord: {
                isActive: false,
                fontFamily: 'Montserrat',
                fontWeight: "800",
                fontSize: 60,
                color: "#bbbbbb",
                isItalic: false,
                isPunctuation: true,
                isUppercase: true,
            },
            background: {
                isActive: true,
                color: "#FF3838",
                radius: 16,
                mode: 'word'
            },
            shadow: {
                isActive: true,
                size: 1,
                color: "#000000",
            },
            border: {
                isActive: true,
                size: 4,
                color: "#000000"
            },
        }
    },
    {
        id: '4',
        name: 'Clean',
        style: {
            template: 'clean',
            fontFamily: 'Montserrat',
            fontWeight: "800",
            fontSize: 40,
            color: "#B0B0B0",
            isItalic: false,
            isPunctuation: true,
            isUppercase: true,
            mode: 'twoLines',
            position: 75,
            animation: {
                appear: "none",
            },
            activeWord: {
                isActive: true,
                fontFamily: 'Montserrat',
                fontWeight: "800",
                fontSize: 40,
                color: "#000000",
                isItalic: false,
                isPunctuation: true,
                isUppercase: true,
            },
            background: {
                isActive: true,
                color: "#E5E7E5",
                radius: 16,
                mode: 'full'
            },
        }
    },
    {
        id: '5',
        name: 'Daniel',
        style: {
            template: 'daniel',
            fontFamily: 'Arial',
            fontWeight: "800",
            fontSize: 80,
            color: "#ffffff",
            isItalic: false,
            isPunctuation: true,
            isUppercase: false,
            mode: 'twoLines',
            position: 50,
            shadow: {
                isActive: true,
                size: 1,
                color: "#000000",
            },
        }
    },
    {
        id: '6',
        name: 'Modern',
        style: {
            template: 'modern',
            fontFamily: 'Arial',
            fontWeight: "800",
            fontSize: 80,
            color: "#ffffff",
            isItalic: false,
            isPunctuation: true,
            isUppercase: false,
            mode: 'twoLines',
            position: 50,
            animation: {
                appear: "blur",
            },
            secondLine: {
                isActive: true,
                fontFamily: 'Fraunces',
                fontWeight: "800",
                fontSize: 80,
                color: "#fee601",
                isItalic: false,
                isPunctuation: true,
                isUppercase: false,
                dynamicSize: true,
            },
            shadow: {
                isActive: true,
                size: 3,
                color: "#000000",
            },
        }
    }
]