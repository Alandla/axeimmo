"use client";

import { IUser } from "../types/user";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { basicApiCall } from '@/src/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { detectAndUpdateLanguage } from './client-geolocation';
import { MixpanelEvent } from "../types/events";
import { track } from "../utils/mixpanel";
import { trackSignUpFacebook } from '@/src/lib/facebook';
import { getCookie } from "./cookies";

// Étendre l'interface Window pour inclure tolt
declare global {
  interface Window {
    tolt?: {
      signup: (email: string) => void;
    };
  }
}

export function AffiliateTracker() {
  const { data: session, update: updateSession } = useSession();
  const [checked, setChecked] = useState(false);
  const [toltReady, setToltReady] = useState(false);
  const [languageChecked, setLanguageChecked] = useState(false);
  const [createdAccountEventSent, setCreatedAccountEventSent] = useState(false);
  const router = useRouter();
  const currentLocale = useLocale();

  // Effet pour vérifier si Tolt est chargé
  useEffect(() => {
    // Fonction pour vérifier si Tolt est prêt
    const checkToltReady = () => {
      if (typeof window !== 'undefined' && window.tolt && typeof window.tolt.signup === 'function') {
        setToltReady(true);
        return true;
      }
      return false;
    };

    // Vérifier immédiatement
    if (checkToltReady()) return;

    // Sinon, configurer un intervalle pour vérifier périodiquement
    const intervalId = setInterval(() => {
      if (checkToltReady()) {
        clearInterval(intervalId);
      }
    }, 500);

    // Nettoyage
    return () => clearInterval(intervalId);
  }, []);

  // Effet pour détecter la langue basée sur l'IP côté client
  useEffect(() => {
    if (!session?.user?.id || !session?.user?.email || languageChecked) {
      return;
    }

    if (session.user?.checkAffiliate) {
      setLanguageChecked(true);
      return;
    }

    const handleLanguageDetection = async () => {
      try {
        if (!session?.user?.id) {
          console.error('User ID is undefined');
          return;
        }

        const newLang = await detectAndUpdateLanguage(session.user.id);
        
        if (!newLang) {
          console.error('Failed to detect language');
          return;
        }
        
        // Mettre à jour la session côté client
        await updateSession({
          user: {
            ...session.user,
            options: { 
              ...(session.user?.options || {}),
              lang: newLang 
            }
          }
        });
        
        // Si la nouvelle langue est différente de la locale actuelle,
        // rafraîchir la page pour que les changements prennent effet
        if (newLang !== currentLocale) {
          router.refresh();
        }
        
        setLanguageChecked(true);
      } catch (error) {
        console.error('Error in language detection process:', error);
      }
    };

    handleLanguageDetection();
  }, [session, languageChecked]);

  useEffect(() => {
    if (!session?.user?.id || !session?.user?.email || checked || !toltReady) {
      return;
    }

    // Check if the user has already been checked for affiliation
    if (session.user?.checkAffiliate) {
      setChecked(true);
      return;
    }

    const checkAffiliate = async () => {
      try {
        if (!createdAccountEventSent) {
          track(MixpanelEvent.CREATED_ACCOUNT);
          setCreatedAccountEventSent(true);
        }

        console.log('Tracking affiliation for:', session?.user?.email);
        
        // À ce stade, nous savons que tolt est prêt et que l'email existe
        if (window.tolt && session.user?.email) {
          window.tolt.signup(session.user.email);
          console.log('Tolt signup tracked for:', session.user.email);
        }
        
        const fbc = getCookie('_fbc');
        const fbp = getCookie('_fbp');
        
        // Suivre l'inscription sur Facebook si les cookies sont disponibles
        if (session.user?.email && session.user?.id && (fbc || fbp)) {
          await trackSignUpFacebook(session.user.email, session.user.id, fbc, fbp);
        }
        
        let updateData: Partial<IUser> = {};
        updateData.checkAffiliate = true;
        await basicApiCall("/user/update", { updateData });
        setChecked(true);
      } catch (error) {
        console.error('Error checking affiliate status:', error);
      }
    };

    checkAffiliate();
  }, [session, checked, toltReady]);

  return null;
}

export default AffiliateTracker;
