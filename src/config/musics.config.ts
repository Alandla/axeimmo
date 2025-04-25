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
            rotate: 295,
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
    },
    {
        name: 'A Serenade to Veracruz',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/A%20Serenade%20to%20Veracruz%20-%20Jimena%20Contreras.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'Bag Man from Yankton',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Bag%20Man%20from%20Yankton%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Bailando con el Viento',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Bailando%20con%20el%20Viento%20-%20Luna%20Cantina.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'Between The Spaces',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Between%20The%20Spaces%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: 'Blue Screen Of Death',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Blue%20Screen%20Of%20Death%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Burlesque',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Burlesque%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'CAVERNS',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/CAVERNS%20-%20Density%20&%20Time.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'California King',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/California%20King%20-%20Bail%20Bonds.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Corny Candy',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Corny%20Candy%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Cumbiera Know It All',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Cumbiera%20Know%20It%20All%20-%20Cumbia%20Deli.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Desert Drive',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Desert%20Drive%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Distrust The System',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Distrust%20The%20System%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 85,
            gradient: 2
        }
    },
    {
        name: 'Doc and Wyatt',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Doc%20and%20Wyatt%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 225,
            gradient: 5
        }
    },
    {
        name: 'Fact or Friction',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Fact%20or%20Friction%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 135,
            gradient: 3
        }
    },
    {
        name: 'Final Girl',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Final%20Girl%20-%20Jeremy%20Blake.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 315,
            gradient: 6
        }
    },
    {
        name: 'Gaughing Las',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Gaughing%20Las%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 195,
            gradient: 4
        }
    },
    {
        name: 'Got Him From Behind',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Got%20Him%20From%20Behind%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 275,
            gradient: 1
        }
    },
    {
        name: 'Hammersion',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Hammersion%20-%20Ezra%20Lipp.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 145,
            gradient: 7
        }
    },
    {
        name: 'Hidden Frozen Lake',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Hidden%20Frozen%20Lake%20-%20Go%20By%20Ocean%20_%20Ryan%20McCaffrey.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 235,
            gradient: 2
        }
    },
    {
        name: 'Highway Nocturne',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Highway%20Nocturne%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 95,
            gradient: 5
        }
    },
    {
        name: 'I Know That I Need You',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/I%20Know%20That%20I%20Need%20You%20-%20Bail%20Bonds.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 185,
            gradient: 3
        }
    },
    {
        name: 'In The Bushes Creepin',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/In%20The%20Bushes%20Creepin_%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 265,
            gradient: 6
        }
    },
    {
        name: 'In The Wild',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/In%20The%20Wild%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 125,
            gradient: 4
        }
    },
    {
        name: 'Keys To Unravel',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Keys%20To%20Unravel%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 305,
            gradient: 1
        }
    },
    {
        name: 'LITE BRITE',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/LITE%20BRITE%20-%20Density%20&%20Time.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 155,
            gradient: 7
        }
    },
    {
        name: 'Losing Your Marbles',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Losing%20Your%20Marbles%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 215,
            gradient: 2
        }
    },
    {
        name: 'Masquerade',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Masquerade%20-%20Luna%20Cantina.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 75,
            gradient: 5
        }
    },
    {
        name: 'Milky Way',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Milky%20Way%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 335,
            gradient: 3
        }
    },
    {
        name: 'Missing Persons',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Missing%20Persons%20-%20Jeremy%20Blake.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 175,
            gradient: 6
        }
    },
    {
        name: 'Moonlight in Mexico',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Moonlight%20in%20Mexico%20-%20Jimena%20Contreras.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 245,
            gradient: 4
        }
    },
    {
        name: 'Moving In The Shadows',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Moving%20In%20The%20Shadows%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 115,
            gradient: 1
        }
    },
    {
        name: 'Nature Nurture',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Nature%20Nurture%20-%20Quincas%20Moreira.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 285,
            gradient: 7
        }
    },
    {
        name: 'Night Shift',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Night%20Shift%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 165,
            gradient: 2
        }
    },
    {
        name: 'Pouncin and Bouncin',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Pouncin%20and%20Bouncin%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 325,
            gradient: 5
        }
    },
    {
        name: 'Ride',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Ride%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 195,
            gradient: 3
        }
    },
    {
        name: 'Shady Guise',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Shady%20Guise%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 65,
            gradient: 6
        }
    },
    {
        name: 'Skating On the Uppers',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Skating%20On%20the%20Uppers%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 235,
            gradient: 4
        }
    },
    {
        name: 'Splinters Lair',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Splinters%20Lair%20-%20Ezra%20Lipp.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 105,
            gradient: 1
        }
    },
    {
        name: 'System Corruption',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/System%20Corruption%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 275,
            gradient: 7
        }
    },
    {
        name: 'TORSION',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/TORSION%20-%20Density%20&%20Time.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 145,
            gradient: 2
        }
    },
    {
        name: 'Tales from Southern Mexico',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Tales%20from%20Southern%20Mexico%20-%20Jimena%20Contreras.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 315,
            gradient: 5
        }
    },
    {
        name: 'Tamalpais',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Tamalpais%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 185,
            gradient: 3
        }
    },
    {
        name: 'The Fast and The Curious',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/The%20Fast%20and%20The%20Curious%20-%20Ezra%20Lipp.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 55,
            gradient: 6
        }
    },
    {
        name: 'Theres Something More',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/There_s%20Something%20More%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 225,
            gradient: 4
        }
    },
    {
        name: 'Timpani For The Devil',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Timpani%20For%20The%20Devil%20-%20Ezra%20Lipp.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 95,
            gradient: 1
        }
    },
    {
        name: 'Too Late Now',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Too%20Late%20Now%20-%20Go%20By%20Ocean%20_%20Ryan%20McCaffrey.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 265,
            gradient: 7
        }
    },
    {
        name: 'Urban Interference',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Urban%20Interference%20-%20Lish%20Grooves.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 135,
            gradient: 2
        }
    },
    {
        name: 'Videodrome',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/Videodrome%20-%20National%20Sweetheart.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 305,
            gradient: 5
        }
    },
    {
        name: 'War Dance',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/War%20Dance%20-%20Ezra%20Lipp.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 175,
            gradient: 3
        }
    },
    {
        name: 'Awaken',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/awaken-136824.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 45,
            gradient: 6
        }
    },
    {
        name: 'Broken Sonata',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/broken-sonata-sad-piano-201839.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 215,
            gradient: 4
        }
    },
    {
        name: 'Cinematic Background Inspirational',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/cinematic-background-inspirational-150013.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 85,
            gradient: 1
        }
    },
    {
        name: 'Cinematic Best Instrumental',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/cinematic-best-instrumental-243892.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 255,
            gradient: 7
        }
    },
    {
        name: 'Cinematic Time Lapse',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/cinematic-time-lapse-115672.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 125,
            gradient: 2
        }
    },
    {
        name: 'Dramatic Documentary Cinematic Suspense',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/dramatic-documentary-cinematic-suspense-coming-for-you-no-drums-236333.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 295,
            gradient: 5
        }
    },
    {
        name: 'Epic',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/epic-231521.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 165,
            gradient: 3
        }
    },
    {
        name: 'Gram Gunna Trap Type Beat',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/gram-gunna-trap-type-beat-264952.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 35,
            gradient: 6
        }
    },
    {
        name: 'Horror Background Atmosphere',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/horror-background-atmosphere-with-creepy-clown-laughter-172681.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 205,
            gradient: 4
        }
    },
    {
        name: 'Horror Dark Cinematic',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/horror-dark-cinematic-music-255259.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 75,
            gradient: 1
        }
    },
    {
        name: 'Nature',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/nature-225116.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 245,
            gradient: 7
        }
    },
    {
        name: 'News Flash Current Events',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/news-flash-current-events-268919.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 115,
            gradient: 2
        }
    },
    {
        name: 'Night of Egypt',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/night-of-egypt-4805.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 285,
            gradient: 5
        }
    },
    {
        name: 'Social Documentary',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/social-documentary-254765.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 155,
            gradient: 3
        }
    },
    {
        name: 'Tearstream Alley',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/tearstream-alley-262939.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 25,
            gradient: 6
        }
    },
    {
        name: 'Yeti',
        genre: Genre.DRAMATIC,
        url: 'https://music.hoox.video/yeti-207573.mp3',
        style: {
            ...genreStyles[Genre.DRAMATIC],
            rotate: 345,
            gradient: 6
        }
    },
    {
        name: 'Afrobeat X Afro Type Beat X Dancehall Beat Instrumental',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/afrobeat-x-afro-type-beat-x-dancehall-beat-instrumental-162906.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'Amapiano Background Lofi African Music',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/amapiano-background-lofi-african-music-244452.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Background Music Instrumental',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/background-music-instrumental-207886.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'Bollywood',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/bollywood-162250.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: 'Documentary Music History Ambient Film Background',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/documentary-music-history-ambient-film-background-intro-theme-270172.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Epic Cinematic Beautiful Dubstep',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/epic-cinematic-beautiful-dubstep-141372.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'Flow of Time Chill Background Music',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/flow-of-time-chill-background-music-271258.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'Idea 10',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/idea-10-203609.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Mug Full of Tunes',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/mug-full-of-tunes-254089.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'The Best Jazz Club in New Orleans',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/the-best-jazz-club-in-new-orleans-164472.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Tvari Tokyo Cafe',
        genre: Genre.EDUCATIONAL,
        url: 'https://music.hoox.video/tvari-tokyo-cafe-159065.mp3',
        style: {
            ...genreStyles[Genre.EDUCATIONAL],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: '90s Old School Type Beat Rap Instrumental Sample Me 2024',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/90-s-old-school-type-beat-rap-instrumental-sample-me-2024-195157.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'Action Rock Background Action Breakbeat Sport Rock',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/action-rock-background-action-breakbeat-sport-rock-200332.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Advertising Stylish Trap',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/advertising-stylish-trap-trap-beat-271592.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'Alive Afrobeat X Afro Instrumental X Reggae X African Type Beat',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/alive-afrobeat-x-afro-instrumental-x-reggae-x-african-type-beat-219814.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: 'Best Background Music',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/best-background-music-238042.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Faty',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/faty-278997.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'Hard Trap Beat',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/hard-trap-beat-262032.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'Infinte Melodic Rap Beat Instrumental',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/infinte-melodic-rap-beat-instrumental-205870.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Perfect Phonk',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/perfect-phonk-142735.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Phonk Ripper',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/phonk-ripper-264431.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Pure Motivation Motivate Hip Hop Sport Gym Fitness',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/pure-motivation-motivate-hip-hop-sport-gym-fitness-158726.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Race Cars Phonk Gaming Music',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/race-cars-phonk-gaming-music-196477.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 85,
            gradient: 6
        }
    },
    {
        name: 'Sensei UK Drill Music',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/sensei-uk-drill-music-21145.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 225,
            gradient: 1
        }
    },
    {
        name: 'Snow',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/snow-132947.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Snowfall Phonk 2024 Mix',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/snowfall-phonk-2024-mix-263878.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 315,
            gradient: 3
        }
    },
    {
        name: 'Stranger Things',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/stranger-things-124008.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 195,
            gradient: 5
        }
    },
    {
        name: 'Thriller Cinema Trailer High Tension',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/thriller-cinema-trailer-high-tension-253965.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 275,
            gradient: 2
        }
    },
    {
        name: 'Town',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/town-10169.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 145,
            gradient: 4
        }
    },
    {
        name: 'Trailer Sport Stylish',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/trailer-sport-stylish-16073.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 235,
            gradient: 6
        }
    },
    {
        name: 'Turn It Up',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/turn-it-up-195069.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 265,
            gradient: 7
        }
    },
    {
        name: 'Upbeat Funky Groove',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/upbeat-funky-groove-279019.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 125,
            gradient: 3
        }
    },
    {
        name: 'Vortex Phonk 2024 Mix',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/vortex-phonk-2024-mix-239249.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 305,
            gradient: 5
        }
    },
    {
        name: 'Wataboi Fiyah',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/wataboi-fiyah-10150.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 175,
            gradient: 2
        }
    },
    {
        name: 'Work Force Positive Upbeat Background Funk',
        genre: Genre.ENTERTAINING,
        url: 'https://music.hoox.video/work-force-positive-upbeat-background-funk-274886.mp3',
        style: {
            ...genreStyles[Genre.ENTERTAINING],
            rotate: 55,
            gradient: 4
        }
    },
    {
        name: 'Eccentric Funny Music',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/eccentric-funny-music-117024.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 120,
            gradient: 3
        }
    },
    {
        name: 'Funy Adventure',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/funy-adventure-257186.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 240,
            gradient: 5
        }
    },
    {
        name: 'Pixel Dreams',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/pixel-dreams-259187.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 180,
            gradient: 2
        }
    },
    {
        name: 'Playground Fun Playful Kids Music',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/playground-fun-playful-kids-music-246604.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 60,
            gradient: 4
        }
    },
    {
        name: 'Puppy Love Waltz',
        genre: Genre.HUMOROUS,
        url: 'https://music.hoox.video/puppy-love-waltz-214978.mp3',
        style: {
            ...genreStyles[Genre.HUMOROUS],
            rotate: 300,
            gradient: 1
        }
    },
    {
        name: 'Afrobeat X Afro Type Beat X Dancehall Beat Instrumental',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/afrobeat-x-afro-type-beat-x-dancehall-beat-instrumental-172358.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'Afrobeat X Afro Type Beat X Dancehall Beat Instrumental Lover',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/afrobeat-x-afro-type-beat-x-dancehall-beat-instrumental-lover-194140.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Amatry Artbybigvee',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/amatry-artbybigvee-171818.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'Before U Go Gunna Trap Type Beat',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/before-u-go-gunna-trap-type-beat-262217.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: 'Complicated Instrumental',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/complicated-instrumental-273140.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Crash Phonk 2024 Mix',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/crash-phonk-2024-mix-258038.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'Deep House Crazy Flute',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/deep-house-crazy-flute-259015.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'Drift Life Phonk 2024 Mix',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/drift-life-phonk-2024-mix-186634.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Drift Rush House Phonk 2024 Mix',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/drift-rush-house-phonk-phonk-2024-mix-164907.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Duro Afro Beat Music',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/duro-afro-beat-music-278978.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Ever Flowing',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/ever-flowing-12277.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'For Future Bass',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/for-future-bass-159125.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 85,
            gradient: 6
        }
    },
    {
        name: 'Fun Day',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/fun-day-150602.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 225,
            gradient: 1
        }
    },
    {
        name: 'Future Bass Nova Bass',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/future-bass-nova-bass-249696.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Futuristic Beat',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/futuristic-beat-146661.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 315,
            gradient: 3
        }
    },
    {
        name: 'Goal Upbeat Motivational Rock',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/goal-upbeat-motivational-rock-271533.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 195,
            gradient: 5
        }
    },
    {
        name: 'Latte Glow',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/latte-glow-254085.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 275,
            gradient: 2
        }
    },
    {
        name: 'Lofi Beat Chill',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/lofi-beat-chill-7373.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 145,
            gradient: 4
        }
    },
    {
        name: 'Lofi Song Memories Sunbeam',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/lofi-song-memories-sunbeam-by-lofium-242711.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 235,
            gradient: 6
        }
    },
    {
        name: 'Lofi Study Beat 1',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/lofi-study-beat-1-245772.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 95,
            gradient: 1
        }
    },
    {
        name: 'Mellow Future Bass Bounce On It',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/mellow-future-bass-bounce-on-it-184234.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 265,
            gradient: 7
        }
    },
    {
        name: 'Powerful Stylish Stomp Rock Lets Go',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/powerful-stylish-stomp-rock-lets-go-114255.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 125,
            gradient: 3
        }
    },
    {
        name: 'Retro Gaming',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/retro-gaming-271301.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 305,
            gradient: 5
        }
    },
    {
        name: 'Rsnce Rapture Phonk 2024 Mix',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/rsnce-rapture-phonk-2024-mix-184915.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 175,
            gradient: 2
        }
    },
    {
        name: 'Summer Trip',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/summer-trip-116233.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 55,
            gradient: 4
        }
    },
    {
        name: 'Tokyo Stroll Chill Lofi Hip Hop Japan Vlog',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/tokyo-stroll-chill-lofi-hip-hop-japan-vlog-265422.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 245,
            gradient: 6
        }
    },
    {
        name: 'Toxic Love Hiphop Music',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/toxic-love-hiphop-music-117607.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 115,
            gradient: 1
        }
    },
    {
        name: 'Travel Lost in the Landscape',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/travel-lost-in-the-landscape-261488.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 285,
            gradient: 7
        }
    },
    {
        name: 'Unique Rap Beat',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/unique-rap-beat-prod-by-sus-beats-205372.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 155,
            gradient: 3
        }
    },
    {
        name: 'Upbeat Corporate Music Business Finance Presentation Background',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/upbeat-corporate-music-business-finance-presentation-background-277020.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Weeknds',
        genre: Genre.INFORMATIVE,
        url: 'https://music.hoox.video/weeknds-122592.mp3',
        style: {
            ...genreStyles[Genre.INFORMATIVE],
            rotate: 295,
            gradient: 2
        }
    },
    {
        name: 'Back to the 80s',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Back%20to%20the%2080s%20-%20Dyalla.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'Beyond',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Beyond%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Blackberry K Two',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Blackberry%20K%20Two%20-%20Squadda%20B.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'Brand New Baby Girl',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Brand%20New%20Baby%20Girl%20-%20Jeremy%20Korpas.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: 'Clean Living',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Clean%20Living%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Cosmic',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Cosmic%20-%20Lish%20Grooves.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'Crops',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Crops%20-%20Telecasted.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'Depth Fuse',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Depth%20Fuse%20-%20French%20Fuse.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Echoes of emir',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Echoes%20of%20emir%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Friendly Dance',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Friendly%20Dance%20-%20Nico%20Staf.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Future Glider',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Future%20Glider%20-%20Brian%20Bolger.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Guitar House',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Guitar%20House%20-%20josh%20pan.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 85,
            gradient: 6
        }
    },
    {
        name: 'I Feel Great',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/I%20Feel%20Great%20-%20Jeremy%20Korpas.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 225,
            gradient: 1
        }
    },
    {
        name: 'Icelandic Arpeggios',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Icelandic%20Arpeggios%20-%20DivKid.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Island Dream',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Island%20Dream%20-%20Chris%20Haugen.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 315,
            gradient: 3
        }
    },
    {
        name: 'Life on Hold',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Life%20on%20Hold%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 195,
            gradient: 5
        }
    },
    {
        name: 'Lyric Melody for Solo Bass',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Lyric%20Melody%20for%20Solo%20Bass%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 275,
            gradient: 2
        }
    },
    {
        name: 'Moonlight Heartbreak Bass Choir',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Moonlight%20Heartbreak%20Bass%20Choir%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 145,
            gradient: 4
        }
    },
    {
        name: 'Nine Lives',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Nine%20Lives%20-%20Unicorn%20Heads.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 235,
            gradient: 6
        }
    },
    {
        name: 'No Indication',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/No%20Indication%20-%20TrackTribe.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 95,
            gradient: 1
        }
    },
    {
        name: 'North Oakland Extasy',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/North%20Oakland%20Extasy%20-%20Squadda%20B.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 265,
            gradient: 7
        }
    },
    {
        name: 'O Boy',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/O%20Boy%20-%20Jeremy%20Black.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 125,
            gradient: 3
        }
    },
    {
        name: 'Point Being',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Point%20Being%20-%20Go%20By%20Ocean%20_%20Ryan%20McCaffrey.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 305,
            gradient: 5
        }
    },
    {
        name: 'Refresher',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Refresher%20-%20Dyalla.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 175,
            gradient: 2
        }
    },
    {
        name: 'Six Seasons',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Six%20Seasons%20-%20Unicorn%20Heads.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 55,
            gradient: 4
        }
    },
    {
        name: 'Snowy Peaks pt I',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Snowy%20Peaks%20pt%20I%20-%20Chris%20Haugen.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 245,
            gradient: 6
        }
    },
    {
        name: 'Spanish Moss',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Spanish%20Moss%20-%20Chris%20Haugen.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 115,
            gradient: 1
        }
    },
    {
        name: 'Speak The Truth',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Speak%20The%20Truth%20-%20Go%20By%20Ocean%20_%20Ryan%20McCaffrey.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 285,
            gradient: 7
        }
    },
    {
        name: 'Squadda B TV',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Squadda%20B%20TV%20-%20Squadda%20B.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 155,
            gradient: 3
        }
    },
    {
        name: 'Strong Self Esteem',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Strong%20Self%20Esteem%20-%20Jeremy%20Korpas.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Temple of treasures',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Temple%20of%20treasures%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 295,
            gradient: 2
        }
    },
    {
        name: 'Tourist Dyalla',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Tourist%20-%20Dyalla.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Tropic Fuse',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Tropic%20Fuse%20-%20French%20Fuse.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 355,
            gradient: 6
        }
    },
    {
        name: 'Yah Ribon',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/Yah%20Ribon%20-%20E_s%20Jammy%20Jams.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 75,
            gradient: 1
        }
    },
    {
        name: 'A Call to the Soul',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/a-call-to-the-soul-149262.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 205,
            gradient: 7
        }
    },
    {
        name: 'Award Adventure',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/award-adventure-epic-inspiring-cinematic-orchestra-214102.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 105,
            gradient: 3
        }
    },
    {
        name: 'Beginning of End',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/beginning-of-end-cinematic-hip-hop-278464.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 275,
            gradient: 5
        }
    },
    {
        name: 'Deep Future Garage',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/deep-future-garage-royalty-free-music-163081.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 145,
            gradient: 2
        }
    },
    {
        name: 'Desires RNB',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/desires-rnb-type-beat-277125.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 315,
            gradient: 4
        }
    },
    {
        name: 'Epic Fast Bitwise EDM',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/epic-fast-bitwise-edm-276879.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 185,
            gradient: 6
        }
    },
    {
        name: 'Midnight Rap Beat Instrumental',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/midnight-rap-beat-instrumental-208305.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 65,
            gradient: 1
        }
    },
    {
        name: 'Rap Beats Music',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/rap-beats-music-161432.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 235,
            gradient: 7
        }
    },
    {
        name: 'Seductive Hear Me',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/seductive-chill-hip-hop-instrumental-hear-me-134134.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 125,
            gradient: 3
        }
    },
    {
        name: 'Soft Piano Music',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/soft-piano-music-255000.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 295,
            gradient: 5
        }
    },
    {
        name: 'Watr Fluid',
        genre: Genre.INSPIRATIONAL,
        url: 'https://music.hoox.video/watr-fluid-10149.mp3',
        style: {
            ...genreStyles[Genre.INSPIRATIONAL],
            rotate: 155,
            gradient: 2
        }
    },
    {
        name: 'Abnormal For You',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/abnormal-for-you-255737.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'Aladdin Acar',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/aladdin-acar-strxd-156723.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Cinematic Fairy Tale',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/cinematic-fairy-tale-story-main-8697.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'Dark Trap Beat',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/dark-trap-beat-silent-121596.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: "7 Seals",
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/drake-type-beat-quot7-sealsquot-httpsbstarszpzxfb-262942.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Dramatic Orchestral Epic',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/dramatic-orchestral-epic-mystery-of-tension-265762.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'Drill Instrumental',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/drill-instrumental-274305.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'Dubai',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/dubai-170748.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Electronic Mysterious Ambient Abyss',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/electronic-mysterious-ambient-abyss-music-276882.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Piano Rap Geschlossene Augen',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/free-melodic-piano-rap-geschlossene-augen-sido-type-beat-075-276804.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Let The Mystery Unfold',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/let-the-mystery-unfold-122118.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Night Whisper',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/night-whisper-247377.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 85,
            gradient: 6
        }
    },
    {
        name: 'Password Infinity',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/password-infinity-123276.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 225,
            gradient: 1
        }
    },
    {
        name: 'Science Documentary',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/science-documentary-169621.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Trap Beat',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/trap-beat-266443.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 315,
            gradient: 3
        }
    },
    {
        name: 'Drunk Time',
        genre: Genre.MYSTERIOUS,
        url: 'https://music.hoox.video/trap-beat-rk-beats-777-drunk-time-158891.mp3',
        style: {
            ...genreStyles[Genre.MYSTERIOUS],
            rotate: 195,
            gradient: 5
        }
    },
    {
        name: 'A Brand New Day',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/A%20Brand%20New%20Day%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 45,
            gradient: 3
        }
    },
    {
        name: 'A Stroll Alone',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/A%20Stroll%20Alone%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 120,
            gradient: 5
        }
    },
    {
        name: 'Among The Stars',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Among%20The%20Stars%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 210,
            gradient: 2
        }
    },
    {
        name: 'BMO Dyalla',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/BMO%20-%20Dyalla.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 180,
            gradient: 4
        }
    },
    {
        name: 'Bazaar Ballad',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Bazaar%20Ballad%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 90,
            gradient: 6
        }
    },
    {
        name: 'Bossa Sonsa',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Bossa%20Sonsa%20-%20Quincas%20Moreira.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 270,
            gradient: 1
        }
    },
    {
        name: 'Campfire',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Campfire%20-%20Telecasted.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 150,
            gradient: 7
        }
    },
    {
        name: 'Carousel Dreams',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Carousel%20Dreams%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 330,
            gradient: 3
        }
    },
    {
        name: 'Colony',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Colony%20-%20TrackTribe.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Cosmic Drift',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Cosmic%20Drift%20-%20DivKid.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 300,
            gradient: 2
        }
    },
    {
        name: 'Creme Brulee',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Creme%20Brulee%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Deck The Halls',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Deck%20The%20Halls%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 85,
            gradient: 6
        }
    },
    {
        name: 'Dont Fret',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Don_t%20Fret%20-%20Quincas%20Moreira.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 225,
            gradient: 1
        }
    },
    {
        name: 'East West',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/East%20West%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 135,
            gradient: 7
        }
    },
    {
        name: 'Erev Shel Shoshanim',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Erev%20Shel%20Shoshanim%20-%20E_s%20Jammy%20Jams.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 315,
            gradient: 3
        }
    },
    {
        name: 'First Dream',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/First%20Dream%20-%20Brian%20Bolger.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 195,
            gradient: 5
        }
    },
    {
        name: 'Galactic Bass',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Galactic%20Bass%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 275,
            gradient: 2
        }
    },
    {
        name: 'Gemini',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Gemini%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 145,
            gradient: 4
        }
    },
    {
        name: 'Georges Lament',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/George_s%20Lament%20-%20Go%20By%20Ocean%20_%20Ryan%20McCaffrey.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 235,
            gradient: 6
        }
    },
    {
        name: 'Glo Fi',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Glo%20Fi%20-%20Windows%20of%20Ken.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 95,
            gradient: 1
        }
    },
    {
        name: 'Going Home',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Going%20Home%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 265,
            gradient: 7
        }
    },
    {
        name: 'Hear The Bells',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Hear%20The%20Bells%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 125,
            gradient: 3
        }
    },
    {
        name: 'Helium',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Helium%20-%20TrackTribe.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 305,
            gradient: 5
        }
    },
    {
        name: 'In Memory of Jean Talon',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/In%20Memory%20of%20Jean%20Talon%20-%20The%20Mini%20Vandals.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 175,
            gradient: 2
        }
    },
    {
        name: 'Jasmine Whipers',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Jasmine%20Whipers%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 55,
            gradient: 4
        }
    },
    {
        name: 'Jay Walking',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Jay%20Walking%20-%20Everet%20Almond.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 245,
            gradient: 6
        }
    },
    {
        name: 'Jingle Bells',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Jingle%20Bells%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 115,
            gradient: 1
        }
    },
    {
        name: 'July',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/July%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 285,
            gradient: 7
        }
    },
    {
        name: 'La Cumbre Dormida',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/La%20Cumbre%20Dormida%20-%20Jovenes%20Viejos.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 155,
            gradient: 3
        }
    },
    {
        name: 'Last Sunrise',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Last%20Sunrise%20-%20Adam%20MacDougall.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Limousines',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Limousines%20-%20TrackTribe.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 295,
            gradient: 2
        }
    },
    {
        name: 'Los Encinos',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Los%20Encinos%20-%20Quincas%20Moreira.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Low Noon',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Low%20Noon%20-%20John%20Patitucci.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 355,
            gradient: 6
        }
    },
    {
        name: 'Mirage melody',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Mirage%20melody%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 75,
            gradient: 1
        }
    },
    {
        name: 'Mothers Lament',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Mother_s%20Lament%20-%20Adam%20MacDougall.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 205,
            gradient: 7
        }
    },
    {
        name: 'Nineties Pad',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Nineties%20Pad%20-%20Brian%20Bolger.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 105,
            gradient: 3
        }
    },
    {
        name: 'Observer',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Observer%20-%20Dyalla.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 275,
            gradient: 5
        }
    },
    {
        name: 'Oman Groomer',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Oman%20Groomer%20-%20The%20Mini%20Vandals.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 145,
            gradient: 2
        }
    },
    {
        name: 'Owls',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Owls%20-%20Lish%20Grooves.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 315,
            gradient: 4
        }
    },
    {
        name: 'Phillip Glass Elevator',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Phillip%20Glass%20Elevator%20-%20Ezra%20Lipp.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 185,
            gradient: 6
        }
    },
    {
        name: 'Sailing',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Sailing%20-%20Telecasted.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 65,
            gradient: 1
        }
    },
    {
        name: 'Satin Moonrise',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Satin%20Moonrise%20-%20Adam%20MacDougall.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 235,
            gradient: 7
        }
    },
    {
        name: 'Seasons',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Seasons%20-%20Telecasted.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 125,
            gradient: 3
        }
    },
    {
        name: 'Silent Night',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Silent%20Night%20-%20The%20Soundlings.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 295,
            gradient: 5
        }
    },
    {
        name: 'Slack Lyfe',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Slack%20Lyfe%20-%20Ryan%20McCaffrey_Go%20By%20Ocean.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 155,
            gradient: 2
        }
    },
    {
        name: 'Sunlit Souk',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Sunlit%20Souk%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 325,
            gradient: 4
        }
    },
    {
        name: 'Today Remains Sweet',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Today%20Remains%20Sweet%20-%20Lish%20Grooves.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 195,
            gradient: 6
        }
    },
    {
        name: 'Veil of mysteries',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/Veil%20of%20mysteries.%20-%20Patrick%20Patrikios.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 85,
            gradient: 1
        }
    },
    {
        name: 'Chill Amp Soul Aesthetic Upebeat Musc For Reels',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/chill-amp-soul-aesthetic-upebeat-musc-for-reels-and-royalty-free-use-203412.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 255,
            gradient: 7
        }
    },
    {
        name: 'Chill Lofi Music Interior Lounge',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/chill-lofi-music-interior-lounge-256260.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 135,
            gradient: 3
        }
    },
    {
        name: 'Classical Guitar Piece With Flamenco Flair',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/classical-guitar-piece-with-flamenco-flair-253103.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 305,
            gradient: 5
        }
    },
    {
        name: 'Feelings Afro Beats Untagged',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/feelings-afro-beats-untagged-254639.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 175,
            gradient: 2
        }
    },
    {
        name: 'Focus Zone Relax Mellow Lofi Music',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/focus-zone-relax-mellow-lofi-music-259701.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 45,
            gradient: 4
        }
    },
    {
        name: 'Guitar 5',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/guitar-5-262269.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 215,
            gradient: 6
        }
    },
    {
        name: 'Kizomba Instrumental African Sun Shine Type Beat',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/kizomba-instrumental-african-sun-shine-type-beat-248350.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 95,
            gradient: 1
        }
    },
    {
        name: 'Lofi Boy Night Waves Lofi Relax Instrumental',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/lofi-boy-night-waves-lofi-relax-instrumental-278248.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 265,
            gradient: 7
        }
    },
    {
        name: 'Lofi Vibes',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/lofi-vibes-113884.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 145,
            gradient: 3
        }
    },
    {
        name: 'Nhac Jazz Thu Gian',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/nhac-jazz-thu-gian-265063.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 315,
            gradient: 5
        }
    },
    {
        name: 'Once In Paris',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/once-in-paris-168895.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 185,
            gradient: 2
        }
    },
    {
        name: 'Relaxed Upbeat Happy Lofi',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/relaxed-upbeat-happy-lofi-276874.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 75,
            gradient: 4
        }
    },
    {
        name: 'Relaxed Vlog Night Street',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/relaxed-vlog-night-street-131746.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 245,
            gradient: 6
        }
    },
    {
        name: 'Rheme Afrobeat X African Instrumental X Reggae Beat',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/rheme-afrobeat-x-african-instrumental-x-reggae-beat-183350.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 115,
            gradient: 1
        }
    },
    {
        name: 'Rizzlas C418',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/rizzlas-c418-224649.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 285,
            gradient: 7
        }
    },
    {
        name: 'Russian Underground Hip Hop Beat',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/russian-underground-hip-hop-beat-273237.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 155,
            gradient: 3
        }
    },
    {
        name: 'Satisfying Lofi For Focus Study Amp Working',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/satisfying-lofi-for-focus-study-amp-working-242103.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 25,
            gradient: 5
        }
    },
    {
        name: 'Smooth Chill Jazzy Music',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/smooth-chill-jazzy-music-275395.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 295,
            gradient: 2
        }
    },
    {
        name: 'Summer Walk',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/summer-walk-152722.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 165,
            gradient: 4
        }
    },
    {
        name: 'Tabla Flute 106',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/tabla-flute-106-262274.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 355,
            gradient: 6
        }
    },
    {
        name: 'Tasty Chill Lofi Vibe',
        genre: Genre.RELAXING,
        url: 'https://music.hoox.video/tasty-chill-lofi-vibe-242105.mp3',
        style: {
            ...genreStyles[Genre.RELAXING],
            rotate: 105,
            gradient: 1
        }
    }
]