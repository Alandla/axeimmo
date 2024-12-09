import { Music, Genre } from "../types/music";

type MusicWithStyle = Music & {
    style: MusicStyle
}

type MusicStyle = {
    hue: number
    saturation: number
    rotate: number
    gradient: number
}

const genreStyles = {
    [Genre.DRAMATIC]: { hue: 255, saturation: 120 },     // Bleu
    [Genre.EDUCATIONAL]: { hue: 120, saturation: 100 },  // Vert
    [Genre.ENTERTAINING]: { hue: 45, saturation: 100 },  // Jaune/Orange
    [Genre.HUMOROUS]: { hue: 300, saturation: 90 },      // Rose
    [Genre.INFORMATIVE]: { hue: 180, saturation: 100 },  // Cyan
    [Genre.MYSTERIOUS]: { hue: 270, saturation: 100 },   // Violet
    [Genre.RELAXING]: { hue: 150, saturation: 80 },      // Vert menthe
    [Genre.INSPIRATIONAL]: { hue: 90, saturation: 100 },  // Rose orangé
};

export const music: MusicWithStyle[] = [
    {
        name: 'Countdown',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/countdown-149998.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 15,
            gradient: 1
        }
    },
    {
        name: 'Typographic Percussion',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/typographic-percussion-music-lapping-and-stomping-112968.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 35,
            gradient: 3
        }
    },
    {
        name: 'One Story Ingrid',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/one-story-ingrid-background-music-for-video-full-hip-hop-version-257221.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 55,
            gradient: 5
        }
    },
    {
        name: 'Legacy of Vivaldi',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/legacy-of-vivaldi-storm-of-the-seasons-background-music-for-video-49s-236343.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 75,
            gradient: 2
        }
    },
    {
        name: 'Power Play',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/power-play-168168.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 95,
            gradient: 4
        }
    },
    {
        name: 'Cinematic Sport Action',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/cinematic-sport-action-trailer-infinite-echoes-185198.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 115,
            gradient: 6
        }
    },
    {
        name: 'War Music',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/war-music-army-military-battlefield-background-intro-theme-270166.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Suspense Background',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/suspense-background-02-254638.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 155,
            gradient: 1
        }
    },
    {
        name: 'Dark Night',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/dark-night-141315.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 175,
            gradient: 3
        }
    },
    {
        name: 'Piano Sonata',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/piano-sonata-267045.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 195,
            gradient: 5
        }
    },
    {
        name: 'Epic Drums Percussion',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/epic-drums-percussion-trailer-intro-promo-262284.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 215,
            gradient: 2
        }
    },
    {
        name: 'Legacy of Beethoven',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/legacy-of-beethoven-moonlight-sonata-hip-hop-background-music-60sec-271409.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 235,
            gradient: 4
        }
    },
    {
        name: 'Clapping Music',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/clapping-music-for-typographic-video-version-2-112975.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 255,
            gradient: 6
        }
    },
    {
        name: 'Drama Suspense',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/drama-suspense-tension-251203.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 275,
            gradient: 7
        }
    },
    {
        name: 'Epic Heroic',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/epic-heroic-motivational-254068.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 295,
            gradient: 1
        }
    },
    {
        name: 'Journey to the Ocean',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/journey-to-the-ocean-emotional-adventure-cinematic-orchestra-233617.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 315,
            gradient: 3
        }
    },
    {
        name: 'Samurai Ethnic',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/samurai-ethnic-ethereal-fantasy-flute-relaxing-meditation-music-248256.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 335,
            gradient: 5
        }
    },
    {
        name: 'Dreams With You',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/dreams-with-you-background-music-for-video-full-hip-hop-version-249227.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 355,
            gradient: 2
        }
    },
    {
        name: 'Epic Emotional',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/epic-emotinal-inspirational-207071.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 15,
            gradient: 4
        }
    },
    {
        name: 'Charging Kids',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/charging-kids-268650.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 35,
            gradient: 6
        }
    },
    {
        name: 'Energetic Indie Rock',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/energetic-indie-rock-252361.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 55,
            gradient: 7
        }
    },
    {
        name: 'Fashion Funk',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/fashion-funk-advertising-marketing-promo-269753.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 75,
            gradient: 1
        }
    },
    {
        name: 'Golden Autumn',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/golden-autumn-247483.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 95,
            gradient: 3
        }
    },
    {
        name: 'Groove Bliss',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/groove-bliss-upbeat-funk-270926.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 115,
            gradient: 5
        }
    },
    {
        name: 'Positive Ambient',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/positive-ambient-background-ambient-euphoria-252100.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 135,
            gradient: 2
        }
    },
    {
        name: 'Positive Hip-Hop',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/positive-hip-hop-264287.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 155,
            gradient: 4
        }
    },
    {
        name: 'Soft Corporate',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/soft-corporate-243262.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 175,
            gradient: 6
        }
    },
    {
        name: 'Stylish Upbeat',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/stylish-upbeat-commercial-advertising-funk-267753.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 195,
            gradient: 7
        }
    },
    {
        name: 'Testosterone Scream',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/testosterone-scream-fighting-sport-gym-workout-dubstep-266617.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 215,
            gradient: 1
        }
    },
    {
        name: 'The Cooking Happy',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/the-cooking-happy-food-music-247323.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 235,
            gradient: 3
        }
    },
    {
        name: 'Travel Upbeat',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/travel-upbeat-happy-fun-background-music-for-videos-244587.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 255,
            gradient: 5
        }
    },
    {
        name: 'Vivid Thunder',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/vivid-thunder-239207.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 275,
            gradient: 2
        }
    },
    {
        name: 'Creative Technology',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/creative-technology-showreel-241274.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 295,
            gradient: 4
        }
    },
    {
        name: 'Energy Percussion',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/energy-percussion-262599.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 315,
            gradient: 6
        }
    },
    {
        name: 'Fashion Day',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/fashion-day-267891.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 335,
            gradient: 7
        }
    },
    {
        name: 'Food Vlog Kitchen',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/food-vlog-cook-chef-kitchen-cooking-background-intro-theme-247350.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 355,
            gradient: 1
        }
    },
    {
        name: 'Summer Travel Vlog',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/for-her-chill-upbeat-summel-travel-vlog-and-ig-music-royalty-free-use-202298.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 15,
            gradient: 3
        }
    },
    {
        name: 'Hard Boiled',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/hard-boiled-267233.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 35,
            gradient: 5
        }
    },
    {
        name: 'Intro Fun',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/intro-fun-239161.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 55,
            gradient: 2
        }
    },
    {
        name: 'Legacy of Beethoven Short',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/legacy-of-beethoven-moonlight-sonata-hip-hop-background-music-43sec-271407.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 75,
            gradient: 4
        }
    },
    {
        name: 'Money Beat',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/money-141327.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 95,
            gradient: 6
        }
    },
    {
        name: 'Night Detective',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/night-detective-226857.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 115,
            gradient: 7
        }
    },
    {
        name: 'OOTD Summer House',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/ootd-upbeat-summer-house-242100.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 135,
            gradient: 1
        }
    },
    {
        name: 'Positive Funk Groove',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/positive-funk-groove-268022.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 155,
            gradient: 3
        }
    },
    {
        name: 'Powerful Beat',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/powerful-beat-121791.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 175,
            gradient: 5
        }
    },
    {
        name: 'Rap Beats',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/rap-beats-music-161432.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 195,
            gradient: 2
        }
    },
    {
        name: 'Showreel Promo',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/showreel-music-promo-advertising-opener-vlog-background-intro-theme-261601.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 215,
            gradient: 4
        }
    },
    {
        name: 'Stomping Rock',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/stomping-rock-four-shots-111444.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 235,
            gradient: 6
        }
    },
    {
        name: 'Synthwave Laser',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/synthwave-laser-drift-251660.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 255,
            gradient: 7
        }
    },
    {
        name: 'The Podcast Intro',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/the-podcast-intro-111863.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 275,
            gradient: 1
        }
    },
    {
        name: 'Trap Future Bass',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/trap-future-bass-royalty-free-music-167020.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 295,
            gradient: 3
        }
    },
    {
        name: 'Trending Promo',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/trending-promo-vlog-opener-hip-hop-267756.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 315,
            gradient: 5
        }
    },
    {
        name: 'Comedy Children',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/comedy-children-kids-funny-cute-music-253486.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 335,
            gradient: 2
        }
    },
    {
        name: 'Prank',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/prank-122485.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 355,
            gradient: 4
        }
    },
    {
        name: 'Quirky Fun',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/quirky-fun-comedy-250869.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 15,
            gradient: 6
        }
    },
    {
        name: 'Silly Kids',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/silly-kids-funny-cute-comedy-music-253487.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 35,
            gradient: 7
        }
    },
    {
        name: 'Windows of Ken',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/Glo-Fi-Windows-of-Ken.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 55,
            gradient: 1
        }
    },
    {
        name: 'Advertising Upbeat Funk',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/advertising-upbeat-funk-funny-music-264403.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 75,
            gradient: 3
        }
    },
    {
        name: 'Bass Clap Drums',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/bass-clap-drums-rhythm-260659.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 95,
            gradient: 5
        }
    },
    {
        name: 'Corporate Advertising',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/corporate-advertising-music-no-copyright-music-264404.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 115,
            gradient: 2
        }
    },
    {
        name: 'Dreams With You Short',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/dreams-with-you-background-music-for-video-hip-hop-version-46-second-249224.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 135,
            gradient: 4
        }
    },
    {
        name: 'Frontline Tech News',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/frontline-tech-news-259477.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 155,
            gradient: 6
        }
    },
    {
        name: 'Funky Vintage',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/funky-vintage-249311.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 175,
            gradient: 7
        }
    },
    {
        name: 'Happy Day',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/happy-day-113985.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 195,
            gradient: 1
        }
    },
    {
        name: 'Holidays in Miami Short',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/holidays-in-miami-background-tropical-house-music-for-video-24-second-264694.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 215,
            gradient: 3
        }
    },
    {
        name: 'Holidays in Miami',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/holidays-in-miami-background-tropical-house-music-for-video-40-second-264697.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 235,
            gradient: 5
        }
    },
    {
        name: 'Information Corporate',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/information-corporate-advertising-music-252179.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 255,
            gradient: 2
        }
    },
    {
        name: 'Lets Go',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/letx27s-go-uplifting-energetic-sport-rock-ads-264035.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 275,
            gradient: 4
        }
    },
    {
        name: 'Motivational Inspiring Piano',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/motivational-inspiring-piano-9837.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 295,
            gradient: 6
        }
    },
    {
        name: 'Rich Elegance',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/rich-elegance-corporate-fashion-270019.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 315,
            gradient: 7
        }
    },
    {
        name: 'Rich Elegance Loop',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/rich-elegance-corporate-fashion-loop-270968.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 335,
            gradient: 1
        }
    },
    {
        name: 'Subway Mirage',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/subway-mirage-261477.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 355,
            gradient: 3
        }
    },
    {
        name: 'Twilight Hustle',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/twilight-hustle-241484.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 15,
            gradient: 5
        }
    },
    {
        name: 'Weeknds',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/weeknds-122592.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 35,
            gradient: 2
        }
    },
    {
        name: 'Whistle Joyride',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/whistle-joyride-193123.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 55,
            gradient: 4
        }
    },
    {
        name: 'Mirage Melody',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/Mirage-melody-Patrick-Patrikios.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 75,
            gradient: 6
        }
    },
    {
        name: 'Observer',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/Observer-Dyalla.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 95,
            gradient: 7
        }
    },
    {
        name: 'Alone in the Dark',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/alone-in-the-dark-background-hip-hop-music-for-video-vlog-43-second-226818.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 115,
            gradient: 1
        }
    },
    {
        name: 'Arabic Desert',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/arabic-desert-196240.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 135,
            gradient: 3
        }
    },
    {
        name: 'Cinematic Documentary',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/cinematic-documentary-115669.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 155,
            gradient: 5
        }
    },
    {
        name: 'Epic Emotional Long',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/epic-emotional_long-197089.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 175,
            gradient: 2
        }
    },
    {
        name: 'Chapter Two',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/leonell-cassio-chapter-two-ft-carrie-114909.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 195,
            gradient: 4
        }
    },
    {
        name: 'No Place to Go',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/no-place-to-go-216744.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 215,
            gradient: 6
        }
    },
    {
        name: 'Nomad Places',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/nomad-places-desert-middle-eastern-112783.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 235,
            gradient: 7
        }
    },
    {
        name: 'R&B Trap Beat',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/rampb-trap-beat-266443.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 255,
            gradient: 1
        }
    },
    {
        name: 'Remember',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/remember-emotional-piano-instrumental-227308.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 275,
            gradient: 3
        }
    },
    {
        name: 'Retro Gaming',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/retro-gaming-271301.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 295,
            gradient: 5
        }
    },
    {
        name: 'A Small Miracle',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/a-small-miracle-132333.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 315,
            gradient: 2
        }
    },
    {
        name: 'Calm Background',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/calm-background-for-video-121519.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 335,
            gradient: 4
        }
    },
    {
        name: 'Christmas Lofi',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/christmas-lofi-music-269177.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 355,
            gradient: 6
        }
    },
    { 
        name: 'Chroma Dusk',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/chroma-dusk-269465.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 15,
            gradient: 7
        }
    },
    {
        name: 'Classical Guitar Flamenco',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/classical-guitar-piece-with-flamenco-flair-253103.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 35,
            gradient: 1
        }
    },
    {
        name: 'Easy Lifestyle',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/easy-lifestyle-137766.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 55,
            gradient: 3
        }
    },
    {
        name: 'For Documentary',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/for-documentary-241238.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 75,
            gradient: 5
        }
    },
    {
        name: 'Forest Lullaby',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/forest-lullaby-110624.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 95,
            gradient: 2
        }
    },
    {
        name: 'In The Forest',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/in-the-forest-ambient-acoustic-guitar-instrumental-background-music-for-videos-5718.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 115,
            gradient: 4
        }
    },
    {
        name: 'Lofi Backyard',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/lofi-song-backyard-by-lofium-242713.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 135,
            gradient: 6
        }
    },
    {
        name: 'Lofi Study',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/lofi-study-calm-peaceful-chill-hop-112191.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 155,
            gradient: 7
        }
    },
    {
        name: 'Mountain Path',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/mountain-path-125573.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 175,
            gradient: 1
        }
    },
    {
        name: 'Sedative',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/sedative-110241.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 195,
            gradient: 3
        }
    },
    {
        name: 'Sunset Beach',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/sunset-beach-259654.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 215,
            gradient: 5
        }
    },
    {
        name: 'Velvet Vibe Sanctuary',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/velvet-vibe-sanctuary-chill-fashion-lounge-deep-house-270242.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 235,
            gradient: 2
        }
    },
    {
        name: 'Electronic Rock King',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/electronic-rock-king-around-here-15045.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 15,
            gradient: 1
        }
    },
    {
        name: 'Golden UK Drill',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/goldn-uk-drill-music-116392.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 35,
            gradient: 3
        }
    },
    {
        name: 'Guitar Electro Sport',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/guitar-electro-sport-trailer-115571.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 55,
            gradient: 5
        }
    },
    {
        name: 'Inspiring Motivational',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/inspiring-motivational-mood-14107.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 75,
            gradient: 2
        }
    },
    {
        name: 'Motivation',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/motivation-258263.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 95,
            gradient: 4
        }
    },
    {
        name: 'Motivational Opening Speech',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/motivational-opening-speech-262288.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 115,
            gradient: 6
        }
    },
    {
        name: 'Stomp Snaps',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/stomp-snaps-111917.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Stomps Riser Rhythm',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/stomps-riser-rhythm-riot-246396.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 155,
            gradient: 1
        }
    },
    {
        name: 'Success Motivation Adventure',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/success-motivation-adventure-heroic-epic-award-263789.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 175,
            gradient: 3
        }
    },
    {
        name: 'The Future Bass',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/the-future-bass-15017.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 195,
            gradient: 5
        }
    }
]