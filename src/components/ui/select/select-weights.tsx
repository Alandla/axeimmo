import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import googleFonts from '@/src/config/googleFonts.config';

interface SelectWeightsProps {
  value: string;
  onChange: (value: string) => void;
  fontFamily: string;
}

// Mapping des poids numériques vers les noms de traduction
const weightTranslationKeys: Record<string, string> = {
  '100': 'weight-thin',
  '200': 'weight-extra-light',
  '300': 'weight-light',
  '400': 'weight-normal',
  '500': 'weight-medium',
  '600': 'weight-semi-bold',
  '700': 'weight-bold',
  '800': 'weight-extra-bold',
  '900': 'weight-black',
};

// Mapping des poids numériques vers les classes CSS correspondantes
const weightCssClasses: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
};

// Fonction utilitaire pour trouver le poids le plus proche
export const findClosestWeight = (targetWeight: string, availableWeights: string[]): string => {
  const target = parseInt(targetWeight);
  
  // Arrondir au multiple de 100 le plus proche
  const roundedTarget = Math.round(target / 100) * 100;
  
  // Vérifier si ce poids arrondi existe dans les poids disponibles
  const roundedStr = roundedTarget.toString();
  if (availableWeights.includes(roundedStr)) {
    return roundedStr;
  }
  
  // Sinon, chercher le plus proche en utilisant la différence minimale
  return availableWeights.reduce((closest, current) => {
    const currentDiff = Math.abs(parseInt(current) - target);
    const closestDiff = Math.abs(parseInt(closest) - target);
    return currentDiff < closestDiff ? current : closest;
  });
};

export default function SelectWeights({ value, onChange, fontFamily }: SelectWeightsProps) {
  const t = useTranslations('edit.subtitle-settings.select');

  // Trouver la police sélectionnée dans la configuration
  const selectedFont = googleFonts.find(font => font.family === fontFamily);
  
  // Utiliser les poids supportés par la police, ou tous les poids par défaut
  const supportedWeights = selectedFont?.supportedWeights || ['400', '500', '600', '700', '800', '900'];

  return (
    <Select value={value} onValueChange={(value) => onChange(value)}>
      <SelectTrigger>
        <SelectValue placeholder={t('weight-placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {supportedWeights.map((weight) => (
          <SelectItem 
            key={weight} 
            value={weight} 
            className={weightCssClasses[weight] || 'font-normal'}
          >
            {t(weightTranslationKeys[weight] || 'weight-normal')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}