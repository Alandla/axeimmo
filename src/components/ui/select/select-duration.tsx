import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { useTranslations } from 'next-intl';

interface DurationOption {
  name: string;
  value: number;
}

interface SelectDurationProps {
  value: DurationOption | undefined;
  onChange: (value: DurationOption) => void;
}

const SelectDuration: React.FC<SelectDurationProps> = ({ value, onChange }) => {
  const t = useTranslations('select.duration');

  const durationOptions: DurationOption[] = [
    { name: t('options.30-seconds'), value: 468 },
    { name: t('options.1-minute'), value: 936 },
    { name: t('options.2-minutes'), value: 1872 },
    { name: t('options.5-minutes'), value: 4680 },
  ];

  return (
    <div>
      <Select
        value={value ? JSON.stringify(value) : undefined}
        onValueChange={(val) => onChange(JSON.parse(val))}
      >
        <SelectTrigger className="mr-2">
          <SelectValue placeholder={t('placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {durationOptions.map((option) => (
            <SelectItem key={option.value} value={JSON.stringify(option)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectDuration;
