import { Avatar } from "./avatar";
import { MemberRole, PlanName, SubscriptionType } from "./enums";
import { IMedia } from "./video";
import { Voice } from "./voice";

export interface ILastUsed {
  voices: string[],
  avatars: string[],
  subtitles: string[],
  formats: string[],
  config?: any;
}

export interface IMember {
  userId: string;
  roles: MemberRole;
}

export interface ISpaceSubtitleStyle {
  id?: string;
  name: string
  style: any
}

export interface IPlan {
  name: PlanName;
  customerId: string;
  priceId: string;
  subscriptionType: SubscriptionType;
  creditsMonth: number;
  storageLimit?: number;
  nextPhase?: Date;
}

export interface IMediaSpace {
  id?: string;
  media: IMedia;
  uploadedBy: string;
  uploadedAt: Date;
  autoPlacement?: boolean;
  baseMediaId?: string;
}

export interface SimpleSpace {
  id: string;
  name: string;
  creditsPerMonth: number;
  credits: number;
  planName: PlanName;
  userRole?: string;
  videoIdeas?: string[];
  companyMission?: string;
  companyTarget?: string;
  usedStorageBytes?: number;
  storageLimit?: number;
}

export interface ICompanyDetails {
  companyName?: string;
  website?: string;
  companyType?: string;
  companySize?: string;
  salesType?: string;
  companyMission?: string;
  companyTarget?: string;
  companyNeeds?: string;
}

export interface ISpace {
  id: string;
  name: string;
  members: IMember[];
  medias: IMediaSpace[];
  plan: IPlan;
  credits: number;
  details?: ICompanyDetails;
  subtitleStyle: ISpaceSubtitleStyle[];
  avatars: Avatar[];
  voices: Voice[];
  videoIdeas: string[];
  lastUsed: ILastUsed;
  usedStorageBytes: number;
}