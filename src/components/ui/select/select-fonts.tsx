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
    for (const font of googleFontsList) {
      font.load()
    }
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
