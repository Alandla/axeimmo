import React from 'react';
import { useTranslations } from 'next-intl';
import { Progress } from './progress';
import { storageLimit } from '@/src/config/plan.config';
import { PlanName } from '@/src/types/enums';
import { cn } from '@/src/lib/utils';
import { formatBytes } from '@/src/utils/format';

interface UsageStorageProps {
  usedStorageBytes: number;
  planName: PlanName;
  customStorageLimit?: number;
}

export function UsageStorage({ usedStorageBytes, planName, customStorageLimit }: UsageStorageProps) {
  const t = useTranslations('dashboard');
  
  // Utiliser la limite personnalisée si disponible, sinon utiliser la limite par défaut du plan
  const maxStorage = customStorageLimit || storageLimit[planName] || storageLimit[PlanName.FREE];
  const percentage = Math.min(Math.round((usedStorageBytes / maxStorage) * 100), 100);
  
  let progressColor = 'bg-green-500';
  
  if (percentage > 90) {
    progressColor = 'bg-destructive';
  } else if (percentage > 70) {
    progressColor = 'bg-amber-500/50';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{t('storage-usage')}</h3>
        <span className="text-xs text-muted-foreground">
          {formatBytes(usedStorageBytes)} / {formatBytes(maxStorage)}
        </span>
      </div>
      <Progress
        value={percentage} 
        className="h-2" 
        indicatorClassName={progressColor}
        aria-label="Storage usage"
      />
    </div>
  );
} 