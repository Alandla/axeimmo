"use client";

import { IUser } from "../types/user";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { basicApiCall } from '@/src/lib/api';

// Étendre l'interface Window pour inclure tolt
declare global {
  interface Window {
    tolt?: {
      signup: (email: string) => void;
    };
  }
}

export function AffiliateTracker() {
  const { data: session } = useSession();
  const [checked, setChecked] = useState(false);
  const [toltReady, setToltReady] = useState(false);

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
        // Track the affiliation on the client side
        console.log('Tracking affiliation for:', session?.user?.email);
        
        // À ce stade, nous savons que tolt est prêt et que l'email existe
        if (window.tolt && session.user?.email) {
          window.tolt.signup(session.user.email);
          console.log('Tolt signup tracked for:', session.user.email);
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
