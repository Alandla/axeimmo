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
]

export const subtitles = [
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
            fontSize: 70,
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
                fontSize: 70,
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
    }
]