import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";

interface DurationOption {
  name: string;
  value: number;
}

const durationOptions: DurationOption[] = [
  { name: "30 secondes", value: 468 },
  { name: "1 minute", value: 936 },
  { name: "2 minutes", value: 1872 },
  { name: "5 minutes", value: 4680 },
];

interface SelectDurationProps {
  value: DurationOption | undefined;
  onChange: (value: DurationOption) => void;
}

const SelectDuration: React.FC<SelectDurationProps> = ({ value, onChange }) => {
  return (
    <Select
      value={value ? JSON.stringify(value) : undefined}
      onValueChange={(val) => onChange(JSON.parse(val))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Durée de la vidéo" />
      </SelectTrigger>
      <SelectContent>
        {durationOptions.map((option) => (
          <SelectItem key={option.value} value={JSON.stringify(option)}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectDuration;
