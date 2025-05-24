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
  load: () => {};
};

const googleFonts: Font[] = [
  {
    family: "Arial",
    load: () => { return {} },
  },
  {
    family: "Montserrat",
    load: loadMontserrat,
  },
  {
    family: "Poppins",
    load: loadPoppins,
  },
  {
    family: "Roboto",
    load: loadRoboto,
  },
  {
    family: "Inter",
    load: loadInter,
  },
  {
    family: "Lora",
    load: loadLora,
  },
  {
    family: "Schoolbell",
    load: loadSchoolbell,
  },
  {
    family: 'Unbounded',
    load: loadUnbounded,
  },
  {
    family: 'Fraunces',
    load: loadFraunces,
  },
  {
    family: "Acme",
    load: loadAcme,
  },
  {
    family: "Amatic SC",
    load: loadAmaticSC,
  },
  {
    family: "Anton",
    load: loadAnton,
  },
  {
    family: "Architects Daughter",
    load: loadArchitectsDaughter,
  },
  {
    family: "Archivo Black",
    load: loadArchivoBlack,
  },
  {
    family: "Archivo Narrow",
    load: loadArchivoNarrow,
  },
  {
    family: "Arimo",
    load: loadArimo,
  },
  {
    family: "Atkinson Hyperlegible",
    load: loadAtkinsonHyperlegible,
  },
  {
    family: "Bad Script",
    load: loadBadScript,
  },
  {
    family: "Barlow Semi Condensed",
    load: loadBarlowSemiCondensed,
  },
  {
    family: "Be Vietnam Pro",
    load: loadBeVietnamPro,
  },
  {
    family: "Belanosima",
    load: loadBelanosima,
  },
  {
    family: "Caveat",
    load: loadCaveat,
  },
  {
    family: "Cormorant Garamond",
    load: loadCormorantGaramond,
  },
  {
    family: "Dancing Script",
    load: loadDancingScript,
  },
  {
    family: "DM Sans",
    load: loadDMSans,
  },
  {
    family: "Dosis",
    load: loadDosis,
  },
  {
    family: "Exo",
    load: loadExo,
  },
  {
    family: "Fira Sans Extra Condensed",
    load: loadFiraSansExtraCondensed,
  },
  {
    family: "Fjalla One",
    load: loadFjallaOne,
  },
  {
    family: "Gloria Hallelujah",
    load: loadGloriaHallelujah,
  },
  {
    family: "Great Vibes",
    load: loadGreatVibes,
  },
  {
    family: "Homemade Apple",
    load: loadHomemadeApple,
  },
  {
    family: "IBM Plex Serif",
    load: loadIBMPlexSerif,
  },
  {
    family: "Indie Flower",
    load: loadIndieFlower,
  },
  {
    family: "Josefin Sans",
    load: loadJosefinSans,
  },
  {
    family: "Kaushan Script",
    load: loadKaushanScript,
  },
  {
    family: "Lexend Deca",
    load: loadLexendDeca,
  },
  {
    family: "Lilita One",
    load: loadLilitaOne,
  },
  {
    family: "Merriweather Sans",
    load: loadMerriweatherSans,
  },
  {
    family: "Oleo Script",
    load: loadOleoScript,
  },
  {
    family: "Pacifico",
    load: loadPacifico,
  },
  {
    family: "Patrick Hand",
    load: loadPatrickHand,
  },
  {
    family: "Permanent Marker",
    load: loadPermanentMarker,
  },
  {
    family: "Public Sans",
    load: loadPublicSans,
  },
  {
    family: "Questrial",
    load: loadQuestrial,
  },
  {
    family: "Reenie Beanie",
    load: loadReenieBeanie,
  },
  {
    family: "Rowdies",
    load: loadRowdies,
  },
  {
    family: "Sacramento",
    load: loadSacramento,
  },
  {
    family: "Satisfy",
    load: loadSatisfy,
  },
  {
    family: "Shadows Into Light",
    load: loadShadowsIntoLight,
  },
  {
    family: "Sofia Sans Condensed",
    load: loadSofiaSansCondensed,
  },
  {
    family: "Special Elite",
    load: loadSpecialElite,
  },
  {
    family: "Suwannaphum",
    load: loadSuwannaphum,
  },
  {
    family: "Teko",
    load: loadTeko,
  },
  {
    family: "Titillium Web",
    load: loadTitilliumWeb,
  },
  {
    family: "Yantramanav",
    load: loadYantramanav,
  },
  {
    family: "Yellowtail",
    load: loadYellowtail,
  },
  {
    family: "Zeyada",
    load: loadZeyada,
  },
];

export default googleFonts;