import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadSchoolbell } from "@remotion/google-fonts/Schoolbell";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadAcme } from "@remotion/google-fonts/Acme";
import { loadFont as loadAmaticSC } from "@remotion/google-fonts/AmaticSC";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchitectsDaughter } from "@remotion/google-fonts/ArchitectsDaughter";
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadArchivoNarrow } from "@remotion/google-fonts/ArchivoNarrow";
import { loadFont as loadArimo } from "@remotion/google-fonts/Arimo";
import { loadFont as loadAtkinsonHyperlegible } from "@remotion/google-fonts/AtkinsonHyperlegible";
import { loadFont as loadBadScript } from "@remotion/google-fonts/BadScript";
import { loadFont as loadBarlowSemiCondensed } from "@remotion/google-fonts/BarlowSemiCondensed";
import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadBelanosima } from "@remotion/google-fonts/Belanosima";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadCormorantGaramond } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadDancingScript } from "@remotion/google-fonts/DancingScript";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadDosis } from "@remotion/google-fonts/Dosis";
import { loadFont as loadExo } from "@remotion/google-fonts/Exo";
import { loadFont as loadFiraSansExtraCondensed } from "@remotion/google-fonts/FiraSansExtraCondensed";
import { loadFont as loadFjallaOne } from "@remotion/google-fonts/FjallaOne";
import { loadFont as loadGloriaHallelujah } from "@remotion/google-fonts/GloriaHallelujah";
import { loadFont as loadGreatVibes } from "@remotion/google-fonts/GreatVibes";
import { loadFont as loadHomemadeApple } from "@remotion/google-fonts/HomemadeApple";
import { loadFont as loadIBMPlexSerif } from "@remotion/google-fonts/IBMPlexSerif";
import { loadFont as loadIndieFlower } from "@remotion/google-fonts/IndieFlower";
import { loadFont as loadJosefinSans } from "@remotion/google-fonts/JosefinSans";
import { loadFont as loadKaushanScript } from "@remotion/google-fonts/KaushanScript";
import { loadFont as loadLexendDeca } from "@remotion/google-fonts/LexendDeca";
import { loadFont as loadLilitaOne } from "@remotion/google-fonts/LilitaOne";
import { loadFont as loadMerriweatherSans } from "@remotion/google-fonts/MerriweatherSans";
import { loadFont as loadOleoScript } from "@remotion/google-fonts/OleoScript";
import { loadFont as loadPacifico } from "@remotion/google-fonts/Pacifico";
import { loadFont as loadPatrickHand } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadPermanentMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadPublicSans } from "@remotion/google-fonts/PublicSans";
import { loadFont as loadQuestrial } from "@remotion/google-fonts/Questrial";
import { loadFont as loadReenieBeanie } from "@remotion/google-fonts/ReenieBeanie";
import { loadFont as loadRowdies } from "@remotion/google-fonts/Rowdies";
import { loadFont as loadSacramento } from "@remotion/google-fonts/Sacramento";
import { loadFont as loadSatisfy } from "@remotion/google-fonts/Satisfy";
import { loadFont as loadShadowsIntoLight } from "@remotion/google-fonts/ShadowsIntoLight";
import { loadFont as loadSofiaSansCondensed } from "@remotion/google-fonts/SofiaSansCondensed";
import { loadFont as loadSpecialElite } from "@remotion/google-fonts/SpecialElite";
import { loadFont as loadSuwannaphum } from "@remotion/google-fonts/Suwannaphum";
import { loadFont as loadTeko } from "@remotion/google-fonts/Teko";
import { loadFont as loadTitilliumWeb } from "@remotion/google-fonts/TitilliumWeb";
import { loadFont as loadYantramanav } from "@remotion/google-fonts/Yantramanav";
import { loadFont as loadYellowtail } from "@remotion/google-fonts/Yellowtail";
import { loadFont as loadZeyada } from "@remotion/google-fonts/Zeyada";

export type Font = {
  family: string;
  load: (weights?: string[], isItalic?: boolean) => Promise<any>;
};

// Helper function to determine weights to load
const getWeightsToLoad = (weights?: string[]): string[] => {
  if (!weights || weights.length === 0) {
    return ['400', '700']; // Default weights
  }
  return weights;
};

// Helper function to load font with optimized options
const createFontLoader = (loadFunction: any, supportedWeights: string[] = ['100', '200', '300', '400', '500', '600', '700', '800', '900']) => {
  return async (weights?: string[], isItalic: boolean = false): Promise<any> => {
    const weightsToLoad = getWeightsToLoad(weights);
    const filteredWeights = weightsToLoad.filter(w => supportedWeights.includes(w));
    
    if (filteredWeights.length === 0) {
      console.warn(`No valid weights found for font. Supported weights: ${supportedWeights.join(', ')}, falling back to default`);
      return await loadFunction();
    }

    const style = isItalic ? 'italic' : 'normal';
    
    try {
      return await loadFunction(style, {
        weights: filteredWeights,
        subsets: ['latin'], // Only load latin subset by default
      });
    } catch (error) {
      console.warn(`Failed to load font with specific options, falling back to default:`, error);
      return await loadFunction();
    }
  };
};

const googleFonts: Font[] = [
  {
    family: "Arial",
    load: async () => ({ fontFamily: "Arial" }),
  },
  {
    family: "Montserrat",
    load: createFontLoader(loadMontserrat),
  },
  {
    family: "Poppins",
    load: createFontLoader(loadPoppins),
  },
  {
    family: "Roboto",
    load: createFontLoader(loadRoboto),
  },
  {
    family: "Inter",
    load: createFontLoader(loadInter),
  },
  {
    family: "Lora",
    load: createFontLoader(loadLora),
  },
  {
    family: "Schoolbell",
    load: createFontLoader(loadSchoolbell, ['400']), // Schoolbell only has 400 weight
  },
  {
    family: 'Unbounded',
    load: createFontLoader(loadUnbounded, ['200', '300', '400', '500', '600', '700', '800', '900']),
  },
  {
    family: 'Fraunces',
    load: createFontLoader(loadFraunces),
  },
  {
    family: "Acme",
    load: createFontLoader(loadAcme, ['400']),
  },
  {
    family: "Amatic SC",
    load: createFontLoader(loadAmaticSC, ['400', '700']),
  },
  {
    family: "Anton",
    load: createFontLoader(loadAnton, ['400']),
  },
  {
    family: "Architects Daughter",
    load: createFontLoader(loadArchitectsDaughter, ['400']),
  },
  {
    family: "Archivo Black",
    load: createFontLoader(loadArchivoBlack, ['400']),
  },
  {
    family: "Archivo Narrow",
    load: createFontLoader(loadArchivoNarrow, ['400', '500', '600', '700']),
  },
  {
    family: "Arimo",
    load: createFontLoader(loadArimo, ['400', '500', '600', '700']),
  },
  {
    family: "Atkinson Hyperlegible",
    load: createFontLoader(loadAtkinsonHyperlegible, ['400', '700']),
  },
  {
    family: "Bad Script",
    load: createFontLoader(loadBadScript, ['400']),
  },
  {
    family: "Barlow Semi Condensed",
    load: createFontLoader(loadBarlowSemiCondensed),
  },
  {
    family: "Be Vietnam Pro",
    load: createFontLoader(loadBeVietnamPro),
  },
  {
    family: "Belanosima",
    load: createFontLoader(loadBelanosima, ['400', '600', '700']),
  },
  {
    family: "Caveat",
    load: createFontLoader(loadCaveat, ['400', '500', '600', '700']),
  },
  {
    family: "Cormorant Garamond",
    load: createFontLoader(loadCormorantGaramond, ['300', '400', '500', '600', '700']),
  },
  {
    family: "Dancing Script",
    load: createFontLoader(loadDancingScript, ['400', '500', '600', '700']),
  },
  {
    family: "DM Sans",
    load: createFontLoader(loadDMSans),
  },
  {
    family: "Dosis",
    load: createFontLoader(loadDosis, ['200', '300', '400', '500', '600', '700', '800']),
  },
  {
    family: "Exo",
    load: createFontLoader(loadExo),
  },
  {
    family: "Fira Sans Extra Condensed",
    load: createFontLoader(loadFiraSansExtraCondensed),
  },
  {
    family: "Fjalla One",
    load: createFontLoader(loadFjallaOne, ['400']),
  },
  {
    family: "Gloria Hallelujah",
    load: createFontLoader(loadGloriaHallelujah, ['400']),
  },
  {
    family: "Great Vibes",
    load: createFontLoader(loadGreatVibes, ['400']),
  },
  {
    family: "Homemade Apple",
    load: createFontLoader(loadHomemadeApple, ['400']),
  },
  {
    family: "IBM Plex Serif",
    load: createFontLoader(loadIBMPlexSerif),
  },
  {
    family: "Indie Flower",
    load: createFontLoader(loadIndieFlower, ['400']),
  },
  {
    family: "Josefin Sans",
    load: createFontLoader(loadJosefinSans, ['100', '200', '300', '400', '500', '600', '700']),
  },
  {
    family: "Kaushan Script",
    load: createFontLoader(loadKaushanScript, ['400']),
  },
  {
    family: "Lexend Deca",
    load: createFontLoader(loadLexendDeca),
  },
  {
    family: "Lilita One",
    load: createFontLoader(loadLilitaOne, ['400']),
  },
  {
    family: "Merriweather Sans",
    load: createFontLoader(loadMerriweatherSans, ['300', '400', '500', '600', '700', '800']),
  },
  {
    family: "Oleo Script",
    load: createFontLoader(loadOleoScript, ['400', '700']),
  },
  {
    family: "Pacifico",
    load: createFontLoader(loadPacifico, ['400']),
  },
  {
    family: "Patrick Hand",
    load: createFontLoader(loadPatrickHand, ['400']),
  },
  {
    family: "Permanent Marker",
    load: createFontLoader(loadPermanentMarker, ['400']),
  },
  {
    family: "Public Sans",
    load: createFontLoader(loadPublicSans),
  },
  {
    family: "Questrial",
    load: createFontLoader(loadQuestrial, ['400']),
  },
  {
    family: "Reenie Beanie",
    load: createFontLoader(loadReenieBeanie, ['400']),
  },
  {
    family: "Rowdies",
    load: createFontLoader(loadRowdies, ['300', '400', '700']),
  },
  {
    family: "Sacramento",
    load: createFontLoader(loadSacramento, ['400']),
  },
  {
    family: "Satisfy",
    load: createFontLoader(loadSatisfy, ['400']),
  },
  {
    family: "Shadows Into Light",
    load: createFontLoader(loadShadowsIntoLight, ['400']),
  },
  {
    family: "Sofia Sans Condensed",
    load: createFontLoader(loadSofiaSansCondensed),
  },
  {
    family: "Special Elite",
    load: createFontLoader(loadSpecialElite, ['400']),
  },
  {
    family: "Suwannaphum",
    load: createFontLoader(loadSuwannaphum, ['100', '300', '400', '700', '900']),
  },
  {
    family: "Teko",
    load: createFontLoader(loadTeko, ['300', '400', '500', '600', '700']),
  },
  {
    family: "Titillium Web",
    load: createFontLoader(loadTitilliumWeb, ['200', '300', '400', '600', '700', '900']),
  },
  {
    family: "Yantramanav",
    load: createFontLoader(loadYantramanav),
  },
  {
    family: "Yellowtail",
    load: createFontLoader(loadYellowtail, ['400']),
  },
  {
    family: "Zeyada",
    load: createFontLoader(loadZeyada, ['400']),
  },
];

export default googleFonts;