import { useMemo, useEffect, useState } from 'react';

interface BrowserInfo {
  isIOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isMobile: boolean;
  userAgent: string;
  isClient: boolean;
}

export function useBrowserDetection(): BrowserInfo {
  const [isClient, setIsClient] = useState(false);

  // S'assurer qu'on est côté client après l'hydratation
  useEffect(() => {
    setIsClient(true);
  }, []);

  const browserInfo = useMemo(() => {
    // Vérification côté client uniquement
    if (!isClient || typeof window === 'undefined') {
      return {
        isIOS: false,
        isSafari: false,
        isChrome: false,
        isFirefox: false,
        isEdge: false,
        isMobile: false,
        userAgent: '',
        isClient: false
      };
    }

    const userAgent = navigator.userAgent;
    const userAgentLower = userAgent.toLowerCase();

    // Détection iOS
    const isIOS = /iphone|ipad|ipod/.test(userAgentLower);
    
    // Détection des navigateurs
    const isSafari = /safari/.test(userAgentLower) && !/chrome/.test(userAgentLower);
    const isChrome = /chrome/.test(userAgentLower) && !/edge/.test(userAgentLower);
    const isFirefox = /firefox/.test(userAgentLower);
    const isEdge = /edge/.test(userAgentLower);

    // Détection mobile
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgentLower);

    return {
      isIOS,
      isSafari,
      isChrome,
      isFirefox,
      isEdge,
      isMobile,
      userAgent,
      isClient: true
    };
  }, [isClient]);

  return browserInfo;
} 