import { Avatar } from "./avatar";
import { MemberRole, PlanName, SubscriptionType } from "./enums";
import { IMedia } from "./video";
import { Voice } from "./voice";


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
  nextPhase?: Date;
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
  avatars: Avatar[];
  voices: Voice[];
}