import { create } from 'zustand'
import { basicApiCall, basicApiGetCall } from '@/src/lib/api'
import { ICompanyDetails, SimpleSpace } from '@/src/types/space'
import { updateSpaceDetails } from '@/src/service/space.service'
import { updateOnboarding } from '../service/user.service'
import { setMixpanelUserProperties, track } from '@/src/utils/mixpanel'
import { MixpanelEvent } from '../types/events'
import { useActiveSpaceStore } from './activeSpaceStore'
import { isProfessionalUser } from '@/src/utils/professional-detection'

export const STEP_CATEGORIES = {
  PERSONAL: "personal-information",
  COMPANY: "company-information"
};

export interface UserOnboardingData {
  name: string
  firstName: string
  role: string
  discoveryChannel: string
  goal: string
}

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

  initStore: () => Promise<void>
  updateUserData: (newData: Partial<UserOnboardingData>) => void
  updateCompanyData: (newData: Partial<CompanyOnboardingData>) => void
  setWebsiteValid: (isValid: boolean) => void
  fetchCompanyInfo: (website: string) => Promise<void>
  saveData: (isComplete?: boolean, userEmail?: string) => Promise<boolean>
  setCurrentStep: (step: number) => void
  goToNextStep: (userEmail?: string) => void
  goToPreviousStep: () => void
  validateCurrentStep: () => boolean
  calculateCurrentStep: (userData?: Partial<UserOnboardingData>, companyData?: Partial<CompanyOnboardingData>) => number
  getStepCategory: () => string
  resetErrors: () => void
}

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

  initStore: async () => {
    set({ isLoading: true });
    
    try {
      const { hasFinishedOnboarding, userData, spaceDetails, simpleSpace } = await basicApiGetCall<{
        hasFinishedOnboarding: boolean;
        userData: UserOnboardingData;
        spaceDetails?: ICompanyDetails;
        simpleSpace?: SimpleSpace;
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
        spaceId: simpleSpace?.id || null
      });

      if (simpleSpace) {
        console.log("simpleSpace", simpleSpace);
        useActiveSpaceStore.getState().setActiveSpace(simpleSpace);
      }
    } catch (error) {
      console.error("Error while loading onboarding data:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserData: (newData) => {
    set(state => ({ 
      dataUser: { ...state.dataUser, ...newData },
      errors: {}
    }));
    setMixpanelUserProperties({
      ...newData
    });
  },
  
  updateCompanyData: (newData) => {
    set(state => ({ 
      dataCompany: { ...state.dataCompany, ...newData },
      errors: {}
    }));
    setMixpanelUserProperties({
      ...newData,
    });
  },
  
  setWebsiteValid: (isValid) => {
    set({ websiteValid: isValid });
  },
  
  fetchCompanyInfo: async (website) => {
    if (!website) return;
    
    set({ isLoadingCompanyInfo: true, lastFetchedWebsite: website, fetchingCompanyData: true });
    
    try {
      const response : any = await basicApiCall("/search/company", { website });
      
      if (response) {
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

        setMixpanelUserProperties({
          ...companyData
        });

        const { spaceId } = get();
        if (spaceId) {
          try {
            await updateSpaceDetails(spaceId, companyData);
          } catch (error) {
            console.error("Error updating space details:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error while fetching company info:", error);
    } finally {
      set({ isLoadingCompanyInfo: false, fetchingCompanyData: false });
    }
  },
  
  saveData: async (isComplete = false, userEmail?: string) => {
    try {
      const { dataUser, dataCompany, spaceId } = get();

      const userResponse = await updateOnboarding(dataUser, isComplete);

      if (userResponse && userResponse.spaces && userResponse.spaces.length > 0) {
        const currentSpaceId = spaceId || userResponse.spaces[0];
        
        if (!spaceId) {
          set({ spaceId: currentSpaceId });
        }
        
        await updateSpaceDetails(currentSpaceId, dataCompany);
      }
      
      if (isComplete) {
        setMixpanelUserProperties({
            hasFinishedOnboarding: true
        });
        track(MixpanelEvent.FINISHED_ONBOARDING);
        set({ hasCompleted: true });
        
        // Check if user is professional and send email to maxime@hoox.video
        try {
          if (userEmail && isProfessionalUser(userEmail, dataCompany.website)) {
            await basicApiCall('/mail/pro', {
              name: dataUser.name,
              firstName: dataUser.firstName,
              email: userEmail,
              role: dataUser.role,
              website: dataCompany.website || '',
              companyName: dataCompany.companyName
            });
            console.log('Professional lead email sent to maxime@hoox.video');
          }
        } catch (emailError) {
          console.error('Error sending professional lead email:', emailError);
          // Continue execution even if email fails
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error while saving onboarding data:", error);
      return false;
    }
  },
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  goToNextStep: (userEmail?: string) => {
    const { currentStep, saveData, dataCompany, fetchCompanyInfo, lastFetchedWebsite } = get();
    
    // If we're at step 4 (company information) and there's a valid website,
    // fetch company info in the background only if the site has changed
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
    saveData(isComplete, userEmail);
  },
  
  goToPreviousStep: () => {
    set(state => ({
      currentStep: Math.max(1, state.currentStep - 1),
      errors: {}
    }));
  },
  
  // Validate current step
  validateCurrentStep: () => {
    const { currentStep, dataUser, dataCompany, websiteValid } = get();
    const newErrors: Record<string, boolean> = {};
    
    switch (currentStep) {
      case 1:
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
      // Step 8: all fields are optional
    }
    
    set({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  },
  
  // Calculate step based on filled data
  calculateCurrentStep: (userData?: Partial<UserOnboardingData>, companyData?: Partial<CompanyOnboardingData>) => {
    const { dataUser, dataCompany } = get();
    const user = userData ? { ...dataUser, ...userData } : dataUser;
    const company = companyData ? { ...dataCompany, ...companyData } : dataCompany;
    
    // Step 1: First name is required
    if (!user.firstName.trim()) return 1;
    
    // Step 2: Role
    if (!user.role) return 2;
    
    // Step 3: Discovery
    if (!user.discoveryChannel) return 3;
    
    // Step 4: Company information
    if (!company.companyName) return 4;
    
    // Step 5: Goal
    if (!user.goal) return 5;
    
    // Step 6: Company type
    if (!company.companyType) return 6;
    
    // Step 7: Sales type
    if (!company.salesType) return 7;
    
    // Step 8: Company details (optional)
    return 8;
  },
  
  // Get current step category
  getStepCategory: () => {
    const { currentStep } = get();
    if (currentStep <= 3) return STEP_CATEGORIES.PERSONAL;
    if (currentStep <= 8) return STEP_CATEGORIES.COMPANY;
    return "";
  },
  
  // Reset errors
  resetErrors: () => set({ errors: {} })
})); 