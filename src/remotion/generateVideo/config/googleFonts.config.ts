import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadSchoolbell } from "@remotion/google-fonts/Schoolbell";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";

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
  }
];

export default googleFonts;