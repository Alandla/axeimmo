import { MemberRole, PlanName, SubscriptionType } from "./enums";
import { IMedia } from "./video";


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
}

export interface IMediaSpace {
  media: IMedia;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface SimpleSpace {
  id: string;
  name: string;
  creditsPerMonth: number;
  credits: number;
  planName: PlanName;
  userRole?: string;
}

export interface ISpace {
  id: string;
  name: string;
  members: IMember[];
  medias: IMediaSpace[];
  plan: IPlan;
  credits: number;
  subtitleStyle: ISpaceSubtitleStyle[];
}