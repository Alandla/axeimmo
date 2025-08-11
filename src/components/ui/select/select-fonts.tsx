import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import googleFonts, { Font } from '@/src/config/googleFonts.config';

interface SelectFontsProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SelectFonts({ value, onChange }: SelectFontsProps) {

  const googleFontsList : Font[] = googleFonts

  useEffect(() => {
    // Load only preview weights for font selector
    const loadFontsForPreview = async () => {
      const previewWeights = ['400', '500', '800'];
      const loadPromises = googleFontsList.map(async (font) => {
        try {
          await font.load(previewWeights, false);
        } catch (error) {
          // Fallback to loading with just weight 400 if the font doesn't support weight 500
          console.warn(`Failed to load ${font.family} with weights [400, 500], trying with [400]`, error);
          try {
            await font.load(['400'], false);
          } catch (fallbackError) {
            console.warn(`Failed to load ${font.family} with any specific weights, using default`, fallbackError);
          }
        }
      });
      
      await Promise.all(loadPromises);
    };

    loadFontsForPreview();
  }, [googleFontsList])

  return (
    <Select value={value} onValueChange={(value) => onChange(value)}>
      <SelectTrigger>
        <SelectValue placeholder="Select Font" />
      </SelectTrigger>
      <SelectContent>
        {googleFontsList.map((font) => (
          <SelectItem key={font.family} value={font.family} style={{ fontFamily: font.family, fontWeight: 500 }}>{font.family}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
