import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { Badge } from "../badge";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { PlanName } from "@/src/types/enums";
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import ModalPricing from "../../modal/modal-pricing";

export interface DurationOption {
  name: string;
  value: number;
  requiredPlan: PlanName;
}

interface SelectDurationProps {
  value: DurationOption | undefined;
  disabled: boolean,
  onChange: (value: DurationOption) => void;
}

const SelectDuration: React.FC<SelectDurationProps> = ({ value, disabled, onChange }) => {
  const t = useTranslations('select.duration');
  const planT = useTranslations('plan');
  const { activeSpace } = useActiveSpaceStore();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedRestrictedOption, setSelectedRestrictedOption] = useState<DurationOption | null>(null);

  const durationOptions: DurationOption[] = [
    { name: t('options.15-seconds'), value: 234, requiredPlan: PlanName.FREE },
    { name: t('options.30-seconds'), value: 468, requiredPlan: PlanName.FREE },
    { name: t('options.1-minute'), value: 936, requiredPlan: PlanName.START },
    { name: t('options.2-minutes'), value: 1872, requiredPlan: PlanName.ENTREPRISE },
    { name: t('options.5-minutes'), value: 4680, requiredPlan: PlanName.ENTREPRISE },
  ];

  const planHierarchy = {
    [PlanName.FREE]: 0,
    [PlanName.START]: 1,
    [PlanName.PRO]: 2,
    [PlanName.ENTREPRISE]: 3,
  };

  const isOptionAvailable = (option: DurationOption) => {
    if (!activeSpace) return false;
    const currentPlanLevel = planHierarchy[activeSpace.planName];
    const requiredPlanLevel = planHierarchy[option.requiredPlan];
    return currentPlanLevel >= requiredPlanLevel;
  };

  const handleValueChange = (val: string) => {
    const selectedOption = JSON.parse(val);
    if (isOptionAvailable(selectedOption)) {
      onChange(selectedOption);
    } else {
      // Ouvrir le modal pricing pour les options non disponibles
      setSelectedRestrictedOption(selectedOption);
      setIsPricingModalOpen(true);
    }
  };

  const getRecommendedPlan = (requiredPlan: PlanName): PlanName => {
    // Si le plan requis est FREE, on recommande START (le plan le plus bas disponible)
    if (requiredPlan === PlanName.FREE) {
      return PlanName.START;
    }
    // Sinon, on recommande le plan requis
    return requiredPlan;
  };

  return (
    <div>
      <Select
        value={value ? JSON.stringify(value) : undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="mr-2">
          <SelectValue placeholder={t('placeholder')} />
        </SelectTrigger>
        <SelectContent className="w-48">
          {durationOptions.map((option) => {
            const isAvailable = isOptionAvailable(option);
            return (
              <SelectItem 
                key={option.value} 
                value={JSON.stringify(option)}
                disabled={false} // On n'utilise plus disabled pour permettre le clic
                rightContent={!isAvailable ? (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="bg-gradient-to-r from-[#FB5688] to-[#9C2779] text-white text-xs border-none shadow-sm font-semibold">
                      {planT(option.requiredPlan)}
                    </Badge>
                    <Lock className="h-3 w-3 text-gray-400" />
                  </div>
                ) : undefined}
              >
                <span className={!isAvailable ? 'text-gray-400' : ''}>{option.name}</span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <ModalPricing
        title={t('toast.title-upgrade-required')}
        description={selectedRestrictedOption ? t('toast.description-upgrade-required', { 
          duration: selectedRestrictedOption.name,
          plan: planT(selectedRestrictedOption.requiredPlan) 
        }) : ''}
        isOpen={isPricingModalOpen}
        setIsOpen={setIsPricingModalOpen}
        features={{
          credits: true,
          watermarkRemoval: false,
          videoMinutes: true,
          urlToVideo: true,
          videoExports: true
        }}
        recommendedPlan={selectedRestrictedOption ? getRecommendedPlan(selectedRestrictedOption.requiredPlan) : PlanName.PRO}
      />
    </div>
  );
};

export default SelectDuration;
