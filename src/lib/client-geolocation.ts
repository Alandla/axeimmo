"use client";

import { IUser } from "../types/user";
import { basicApiCall } from '@/src/lib/api';

// Liste des pays francophones (codes ISO 3166-1 alpha-2)
export const FRANCOPHONE_COUNTRIES = [
  'BJ', // Bénin
  'CG', // Congo
  'CD', // République démocratique du Congo
  'CI', // Côte d'Ivoire
  'FR', // France
  'GA', // Gabon
  'GN', // Guinée
  'MC', // Monaco
  'NE', // Niger
  'SN', // Sénégal
  'TG', // Togo
];

/**
 * Vérifie si un code pays correspond à un pays francophone
 * @param countryCode - Le code pays ISO 3166-1 alpha-2
 * @returns true si le pays est francophone, false sinon
 */
export function isFrancophoneCountry(countryCode: string): boolean {
  return FRANCOPHONE_COUNTRIES.includes(countryCode);
}

/**
 * Obtient le pays de l'utilisateur à partir de son adresse IP
 * @returns Un objet avec le code pays et une indication si le pays est francophone
 */
export async function detectCountryFromIP(): Promise<{ 
  countryCode: string | null;
  isFrancophone: boolean;
}> {
  try {
    
    // Utiliser l'API FreeIPAPI pour obtenir le pays de l'utilisateur
    const response = await fetch('https://freeipapi.com/api/json');
    
    if (!response.ok) {
      return { countryCode: null, isFrancophone: false };
    }
    
    const data = await response.json();
    
    if (!data.countryCode) {
      return { countryCode: null, isFrancophone: false };
    }
    
    // Vérifier si le pays est francophone
    const isFrancophone = isFrancophoneCountry(data.countryCode);
    
    return { 
      countryCode: data.countryCode,
      isFrancophone 
    };
  } catch (error) {
    return { countryCode: null, isFrancophone: false };
  }
}

/**
 * Met à jour la langue préférée de l'utilisateur
 * @param userId - L'identifiant de l'utilisateur
 * @param isFrancophone - Si l'utilisateur est dans un pays francophone
 * @returns La langue qui a été définie
 */
export async function updateUserLanguage(
  userId: string, 
  isFrancophone: boolean
): Promise<string> {
  try {
    // Déterminer la langue en fonction du pays
    const newLang = isFrancophone ? "fr" : "en";
    
    // Mettre à jour les préférences de langue de l'utilisateur sur le serveur
    let updateData: Partial<IUser> = {
      options: {
        lang: newLang
      }
    };
    
    await basicApiCall("/user/update", { updateData });
    
    return newLang;
  } catch (error) {
    return "en";
  }
}

/**
 * Détecte la langue de l'utilisateur basée sur sa géolocalisation et la met à jour
 * @param userId - L'identifiant de l'utilisateur
 * @returns La langue qui a été définie ou null en cas d'erreur
 */
export async function detectAndUpdateLanguage(userId: string): Promise<string | null> {
  try {
    const { countryCode, isFrancophone } = await detectCountryFromIP();
    
    if (!countryCode) {
      return null;
    }
    
    const newLang = await updateUserLanguage(userId, isFrancophone);
    return newLang;
  } catch (error) {
    return null;
  }
} 