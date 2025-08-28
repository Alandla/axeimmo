// Types de format vidéo
export type VideoFormat = 'vertical' | 'ads' | 'square' | 'horizontal';

// Structure pour les options de format vidéo
interface VideoFormatOption {
  value: VideoFormat;
  ratio: string;
  width: number;
  height: number;
  effectiveHeight: number; // Hauteur effective pour les sous-titres
}

// Configuration des formats disponibles
const VIDEO_FORMATS: VideoFormatOption[] = [
  { value: 'vertical', ratio: '9:16', width: 1080, height: 1920, effectiveHeight: 1750 },
  { value: 'ads', ratio: '4:5', width: 1080, height: 1350, effectiveHeight: 1230 }, // 1350 * (1750/1920)
  { value: 'square', ratio: '1:1', width: 1080, height: 1080, effectiveHeight: 985 }, // 1080 * (1750/1920)
  { value: 'horizontal', ratio: '16:9', width: 1920, height: 1080, effectiveHeight: 985 } // 1080 * (1750/1920)
];

/**
 * Obtient les dimensions de la vidéo en fonction du format spécifié
 * @param format Format de la vidéo (vertical, ads, square)
 * @returns Objet contenant la largeur et la hauteur
 */
export const getVideoDimensions = (format: VideoFormat = 'vertical'): { width: number; height: number } => {
  const formatConfig = VIDEO_FORMATS.find(f => f.value === format);
  return formatConfig ? { width: formatConfig.width, height: formatConfig.height } : { width: 1080, height: 1920 };
};

/**
 * Calcule la position verticale des sous-titres en fonction du format vidéo
 * @param position Position en pourcentage (0-100)
 * @param format Format de la vidéo
 * @returns Position en pixels basée sur la hauteur effective
 */
export const calculateSubtitlePosition = (position: number, format: VideoFormat = 'vertical'): number => {
  const formatConfig = VIDEO_FORMATS.find(f => f.value === format);
  const effectiveHeight = formatConfig ? formatConfig.effectiveHeight : 1750;
  return (position / 100) * effectiveHeight;
}; 