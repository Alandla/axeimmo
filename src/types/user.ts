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
  goal: string;
  discoveryChannel: string;
  role: string;
  hasFinishedOnboarding: boolean;
}