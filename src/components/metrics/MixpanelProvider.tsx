'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/src/utils/mixpanel';

export default function MixpanelProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  // Suivi de chaque changement de page
  useEffect(() => {
    // Vérifie si ce chemin a déjà été suivi récemment
    if (pathname !== lastTrackedPath.current) {
      // On envoie la vue de page à chaque changement de route
      trackPageView(pathname);
      lastTrackedPath.current = pathname;
    }
  }, [pathname, searchParams]);

  // Pas besoin de rendu visible
  return null;
} 