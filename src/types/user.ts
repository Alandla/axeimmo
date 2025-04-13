export interface IUser {
  id: string;
  name?: string;
  firstName?: string;
  email?: string;
  image?: string;
  customerId?: string;
  emailVerified?: Date;
  options?: {
    lang: string;
  };
  spaces?: string[];
  checkAffiliate?: boolean;
  role?: string;
  discoveryChannel?: string;
  goal?: string;
  hasFinishedOnboarding?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  provider?: string;
  deviceId?: string;
}