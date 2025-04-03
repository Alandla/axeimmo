export interface OnboardingData {
  role: string;
  discoveryChannel: string;
  companyName: string;
  website: string;
  goal: string;
  companyType: string;
  companySize: string;
  salesType: string;
  companyMission: string;
  companyGoals: string;
  additionalInfo: string;
}

export interface IUser {
  id: string;
  name: string;
  firstName: string;
  email: string;
  image: string;
  customerId: string;
  options: {
    lang: string;
  };
  spaces: string[];
  checkAffiliate?: boolean;
  onboardingData?: OnboardingData;
  hasFinishedOnboarding: boolean;
}