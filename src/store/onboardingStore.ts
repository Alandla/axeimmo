import { create } from 'zustand'
import { basicApiCall, basicApiGetCall } from '@/src/lib/api'
import { ICompanyDetails } from '@/src/types/space'
import { updateSpaceDetails } from '@/src/service/space.service'
import { updateOnboarding } from '../service/user.service'

// Les données qui seront stockées sur l'utilisateur
export interface UserOnboardingData {
  // Informations personnelles
  name: string
  firstName: string
  role: string
  discoveryChannel: string
  goal: string
}

// Les données qui seront stockées sur le Space
export interface CompanyOnboardingData {
  companyName: string
  website: string
  companyType: string
  companySize: string
  salesType: string
  companyMission: string
  companyTarget: string
  companyNeeds: string
  videoIdeas?: string[]
}

interface OnboardingStore {
  // États
  dataUser: UserOnboardingData
  dataCompany: CompanyOnboardingData
  isLoading: boolean
  hasCompleted: boolean
  currentStep: number
  errors: Record<string, boolean>
  websiteValid: boolean
  companyInfo: any | null
  isLoadingCompanyInfo: boolean
  spaceId: string | null
  lastFetchedWebsite: string
  fetchingCompanyData: boolean
  
  // Actions
  initStore: () => Promise<void>
  updateUserData: (newData: Partial<UserOnboardingData>) => void
  updateCompanyData: (newData: Partial<CompanyOnboardingData>) => void
  setWebsiteValid: (isValid: boolean) => void
  fetchCompanyInfo: (website: string) => Promise<void>
  saveData: (isComplete?: boolean) => Promise<boolean>
  setCurrentStep: (step: number) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  validateCurrentStep: () => boolean
  calculateCurrentStep: (userData?: Partial<UserOnboardingData>, companyData?: Partial<CompanyOnboardingData>) => number
  getStepCategory: () => string
  resetErrors: () => void
}

// Valeurs par défaut
const defaultUserData: UserOnboardingData = {
  name: "",
  firstName: "",
  role: "",
  discoveryChannel: "",
  goal: ""
}

const defaultCompanyData: CompanyOnboardingData = {
  companyName: "",
  website: "",
  companyType: "",
  companySize: "2-10",
  salesType: "",
  companyMission: "",
  companyNeeds: "",
  companyTarget: "",
  videoIdeas: []
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // États initiaux
  dataUser: { ...defaultUserData },
  dataCompany: { ...defaultCompanyData },
  isLoading: true,
  hasCompleted: false,
  currentStep: 1,
  errors: {},
  websiteValid: true,
  companyInfo: null,
  isLoadingCompanyInfo: false,
  spaceId: null,
  lastFetchedWebsite: "",
  fetchingCompanyData: false,
  
  // Initialisation du store avec les données existantes du serveur
  initStore: async () => {
    set({ isLoading: true });
    
    try {
      const { hasFinishedOnboarding, userData, spaceDetails, spaceId } = await basicApiGetCall<{
        hasFinishedOnboarding: boolean;
        userData: UserOnboardingData;
        spaceDetails?: ICompanyDetails;
        spaceId?: string;
      }>("/user/onboarding");
      
      if (hasFinishedOnboarding) {
        set({ hasCompleted: true });
      }
      
      const calculatedStep = get().calculateCurrentStep(
        { ...defaultUserData, ...userData }, 
        { ...defaultCompanyData, ...spaceDetails as Partial<CompanyOnboardingData> }
      );
      
      set({ 
        dataUser: { ...defaultUserData, ...userData },
        dataCompany: { ...defaultCompanyData, ...spaceDetails as Partial<CompanyOnboardingData> },
        currentStep: calculatedStep,
        hasCompleted: hasFinishedOnboarding,
        spaceId: spaceId || null
      });
    } catch (error) {
      console.error("Error while loading onboarding data:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Mise à jour des données utilisateur
  updateUserData: (newData) => {
    set(state => ({ 
      dataUser: { ...state.dataUser, ...newData },
      errors: {} // Réinitialiser les erreurs lors d'une mise à jour
    }));
  },
  
  // Mise à jour des données d'entreprise
  updateCompanyData: (newData) => {
    set(state => ({ 
      dataCompany: { ...state.dataCompany, ...newData },
      errors: {} // Réinitialiser les erreurs lors d'une mise à jour
    }));
  },
  
  // Mise à jour de la validité du site web
  setWebsiteValid: (isValid) => {
    set({ websiteValid: isValid });
  },
  
  // Récupération des informations d'entreprise à partir de l'URL du site web
  fetchCompanyInfo: async (website) => {
    if (!website) return;

    console.log("Fetching company info for website:", website);
    
    set({ isLoadingCompanyInfo: true, lastFetchedWebsite: website, fetchingCompanyData: true });
    
    try {
      const response : any = await basicApiCall("/search/company", { website });
      
      if (response) {
        console.log("Company info", response);

        const companyData = {
          companyMission: response.mission || get().dataCompany.companyMission,
          companyTarget: response.audience || get().dataCompany.companyTarget,
          companyNeeds: response.need || get().dataCompany.companyNeeds,
          videoIdeas: response.ideas || get().dataCompany.videoIdeas
        };

        set(state => ({
          dataCompany: {
            ...state.dataCompany,
            ...companyData
          }
        }));

        const { spaceId } = get();
        if (spaceId) {
          try {
            await updateSpaceDetails(spaceId, companyData);
            console.log("Détails du space mis à jour avec les données d'entreprise");
          } catch (error) {
            console.error("Erreur lors de la mise à jour des détails du space:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error while fetching company info:", error);
    } finally {
      set({ isLoadingCompanyInfo: false, fetchingCompanyData: false });
    }
  },
  
  // Sauvegarde des données sur le serveur
  saveData: async (isComplete = false) => {
    try {
      const { dataUser, dataCompany, spaceId } = get();

      const userResponse = await updateOnboarding(dataUser, isComplete);

      if (userResponse && userResponse.spaces && userResponse.spaces.length > 0) {
        const currentSpaceId = spaceId || userResponse.spaces[0]; // Utiliser le spaceId stocké ou le premier espace de l'utilisateur
        
        // Mettre à jour le spaceId dans le store si nécessaire
        if (!spaceId) {
          set({ spaceId: currentSpaceId });
        }
        
        await updateSpaceDetails(currentSpaceId, dataCompany);
      }
      
      if (isComplete) {
        set({ hasCompleted: true });
      }
      
      return true;
    } catch (error) {
      console.error("Error while saving onboarding data:", error);
      return false;
    }
  },
  
  // Gestion des étapes
  setCurrentStep: (step) => set({ currentStep: step }),
  
  goToNextStep: () => {
    const { currentStep, saveData, dataCompany, fetchCompanyInfo, lastFetchedWebsite } = get();
    
    // Si nous sommes à l'étape 4 (informations sur l'entreprise) et qu'il y a un site web valide,
    // récupérer les informations de l'entreprise en arrière-plan uniquement si le site a changé
    if (currentStep === 4 && 
        dataCompany.website && 
        dataCompany.website !== lastFetchedWebsite && 
        !dataCompany.companyMission && 
        !dataCompany.companyTarget && 
        !dataCompany.companyNeeds) {
      fetchCompanyInfo(dataCompany.website);
    }
    
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
    const { currentStep, dataUser, dataCompany, websiteValid } = get();
    const newErrors: Record<string, boolean> = {};
    
    switch (currentStep) {
      case 1:
        if (!dataUser.name.trim()) newErrors.name = true;
        if (!dataUser.firstName.trim()) newErrors.firstName = true;
        break;
      case 2:
        if (!dataUser.role) newErrors.role = true;
        break;
      case 3:
        if (!dataUser.discoveryChannel) newErrors.discoveryChannel = true;
        break;
      case 4:
        if (!dataCompany.companyName.trim()) newErrors.companyName = true;
        if (dataCompany.website && !websiteValid) newErrors.website = true;
        break;
      case 5:
        if (!dataUser.goal) newErrors.goal = true;
        break;
      case 6:
        if (!dataCompany.companyType) newErrors.companyType = true;
        break;
      case 7:
        if (!dataCompany.salesType) newErrors.salesType = true;
        break;
      // Étape 8: tous les champs sont optionnels
    }
    
    set({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  },
  
  // Calcul de l'étape en fonction des données remplies
  calculateCurrentStep: (userData?: Partial<UserOnboardingData>, companyData?: Partial<CompanyOnboardingData>) => {
    const { dataUser, dataCompany } = get();
    const user = userData ? { ...dataUser, ...userData } : dataUser;
    const company = companyData ? { ...dataCompany, ...companyData } : dataCompany;
    
    // Étape 1: Informations personnelles
    if (!user.name || !user.firstName) return 1;
    
    // Étape 2: Rôle
    if (!user.role) return 2;
    
    // Étape 3: Découverte
    if (!user.discoveryChannel) return 3;
    
    // Étape 4: Informations sur l'entreprise
    if (!company.companyName) return 4;
    
    // Étape 5: Objectif
    if (!user.goal) return 5;
    
    // Étape 6: Type d'entreprise
    if (!company.companyType) return 6;
    
    // Étape 7: Type de ventes
    if (!company.salesType) return 7;
    
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