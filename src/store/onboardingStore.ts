import { create } from 'zustand'
import { basicApiCall, basicApiGetCall } from '@/src/lib/api'

export interface OnboardingData {
  // Informations personnelles
  name: string
  firstName: string
  role: string
  discoveryChannel: string

  // Informations sur l'entreprise
  companyName: string
  website: string
  goal: string
  companyType: string
  companySize: string
  salesType: string
  companyMission: string
  companyGoals: string
  companyTarget: string
}

interface OnboardingStore {
  // États
  data: OnboardingData
  isLoading: boolean
  hasCompleted: boolean
  currentStep: number
  errors: Record<string, boolean>
  
  // Actions
  initStore: () => Promise<void>
  updateData: (newData: Partial<OnboardingData>) => void
  saveData: (isComplete?: boolean) => Promise<boolean>
  setCurrentStep: (step: number) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  validateCurrentStep: () => boolean
  calculateCurrentStep: () => number
  getStepCategory: () => string
  resetErrors: () => void
}

// Valeurs par défaut
const defaultData: OnboardingData = {
  name: "",
  firstName: "",
  role: "",
  discoveryChannel: "",
  companyName: "",
  website: "",
  goal: "",
  companyType: "",
  companySize: "2-10",
  salesType: "",
  companyMission: "",
  companyGoals: "",
  companyTarget: ""
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // États initiaux
  data: { ...defaultData },
  isLoading: true,
  hasCompleted: false,
  currentStep: 1,
  errors: {},
  
  // Initialisation du store avec les données existantes du serveur
  initStore: async () => {
    set({ isLoading: true });
    
    try {
      const response = await basicApiGetCall<{
        hasFinishedOnboarding: boolean;
        onboardingData: OnboardingData | null;
      }>("/user/onboarding");
      
      if (response.hasFinishedOnboarding) {
        set({ hasCompleted: true });
      }
      
      if (response.onboardingData) {
        const data = response.onboardingData;
        const calculatedStep = get().calculateCurrentStep();
        
        set({ 
          data, 
          currentStep: calculatedStep,
          hasCompleted: response.hasFinishedOnboarding
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données d'onboarding:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Mise à jour des données locales
  updateData: (newData) => {
    console.log("newData", newData)
    set(state => ({ 
      data: { ...state.data, ...newData },
      errors: {} // Réinitialiser les erreurs lors d'une mise à jour
    }));
  },
  
  // Sauvegarde des données sur le serveur
  saveData: async (isComplete = false) => {
    try {
      // Création d'un objet propre pour l'API
      const cleanData = { ...get().data };
      console.log("cleanData", cleanData)
      
      await basicApiCall("/user/onboarding", {
        onboardingData: cleanData,
        hasFinishedOnboarding: isComplete
      });
      
      if (isComplete) {
        set({ hasCompleted: true });
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données d'onboarding:", error);
      return false;
    }
  },
  
  // Gestion des étapes
  setCurrentStep: (step) => set({ currentStep: step }),
  
  goToNextStep: () => {
    const { currentStep, saveData } = get();
    
    const nextStep = currentStep + 1;
    const totalSteps = 8;
    const isComplete = nextStep > totalSteps;
    
    set({ currentStep: nextStep });
    saveData(isComplete);
  },
  
  goToPreviousStep: () => {
    set(state => ({
      currentStep: Math.max(1, state.currentStep - 1),
      errors: {}
    }));
  },
  
  // Validation de l'étape courante
  validateCurrentStep: () => {
    const { currentStep, data } = get();
    const newErrors: Record<string, boolean> = {};
    
    switch (currentStep) {
      case 1:
        if (!data.name.trim()) newErrors.name = true;
        if (!data.firstName.trim()) newErrors.firstName = true;
        break;
      case 2:
        if (!data.role) newErrors.role = true;
        break;
      case 3:
        if (!data.discoveryChannel) newErrors.discoveryChannel = true;
        break;
      case 4:
        if (!data.companyName.trim()) newErrors.companyName = true;
        break;
      case 5:
        if (!data.goal) newErrors.goal = true;
        break;
      case 6:
        if (!data.companyType) newErrors.companyType = true;
        break;
      case 7:
        if (!data.salesType) newErrors.salesType = true;
        break;
      // Étape 8: tous les champs sont optionnels
    }
    
    set({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  },
  
  // Calcul de l'étape en fonction des données remplies
  calculateCurrentStep: () => {
    const { data } = get();
    
    // Étape 1: Informations personnelles
    if (!data.name || !data.firstName) return 1;
    
    // Étape 2: Rôle
    if (!data.role) return 2;
    
    // Étape 3: Découverte
    if (!data.discoveryChannel) return 3;
    
    // Étape 4: Informations sur l'entreprise
    if (!data.companyName) return 4;
    
    // Étape 5: Objectif
    if (!data.goal) return 5;
    
    // Étape 6: Type d'entreprise
    if (!data.companyType) return 6;
    
    // Étape 7: Type de ventes
    if (!data.salesType) return 7;
    
    // Étape 8: Détails de l'entreprise (optionnels)
    return 8;
  },
  
  // Obtenir la catégorie de l'étape actuelle
  getStepCategory: () => {
    const { currentStep } = get();
    if (currentStep <= 3) return "Personal Information";
    if (currentStep <= 8) return "Company Information";
    return "";
  },
  
  // Réinitialiser les erreurs
  resetErrors: () => set({ errors: {} })
})); 