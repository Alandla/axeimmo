// Déclaration de type pour l'extension de l'objet Window avec les propriétés Tolt
interface Window {
  tolt_referral?: string;
  tolt?: {
    signup: (email: string) => void;
    // Ajoutez d'autres méthodes de l'API Tolt si nécessaire
  };
} 