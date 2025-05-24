'use client'

import { useActiveSpaceStore } from '@/src/store/activeSpaceStore';
import { UsageStorage } from '@/src/components/ui/usage-storage';
import { Button } from '@/src/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlanName } from '@/src/types/enums';
import { storageLimit } from '@/src/config/plan.config';
import { usePathname } from 'next/navigation';
// import { useAssetsStore } from '@/src/store/assetsStore'; // Pour accéder à isUploading, temporairement désactivé

export function DashboardHeaderControls() {
  const t = useTranslations('assets');
  const { activeSpace } = useActiveSpaceStore();
  const pathname = usePathname();

  const isUploadingAssets = false;

  const isAssetsPage = pathname.includes('/assets');

  if (!isAssetsPage) {
    return null;
  }

  const usedStorage = activeSpace?.usedStorageBytes || 0;
  const storageMax = activeSpace?.storageLimit || storageLimit[activeSpace?.planName || PlanName.FREE];
  
  const hasPlan = activeSpace?.planName === PlanName.PRO || activeSpace?.planName === PlanName.ENTREPRISE;
  const isStorageFull = storageMax > 0 ? (usedStorage / storageMax) >= 1 : true; 

  const isUploadDisabled = !activeSpace?.id || 
                           isUploadingAssets || 
                           !hasPlan || 
                           isStorageFull;

  const handleUploadClick = () => {
    document.getElementById('file-input')?.click();
  };

  return (
    <div className={`hidden md:flex items-center gap-4 ${activeSpace && !hasPlan ? 'filter blur-sm pointer-events-none' : ''}`}>
      <div className="w-64">
        <UsageStorage
          usedStorageBytes={usedStorage}
          planName={activeSpace?.planName || PlanName.FREE}
          customStorageLimit={activeSpace?.storageLimit}
        />
      </div>
      {/* Le bouton est maintenant toujours affiché car le composant entier est conditionnel */}
      <Button
        disabled={isUploadDisabled}
        onClick={handleUploadClick}
      >
        {/* Logique de l'icône simplifiée, isAssetsPage est vrai ici */}
        {isUploadingAssets ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {t('upload-button')}
      </Button>
    </div>
  );
} 