import UserModel from "../models/User";
import SpaceModel from "../models/Space";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";
import connectMongo from "../lib/mongoose";
import { addSpaceToUser } from "./userDao";

export const createPrivateSpaceForUser = async (userId: string, userName: string) => {
  await connectMongo();

  const spaceName = userName ? `${userName}'s Private Space` : "My Private Space";

  const space = new SpaceModel({
    name: spaceName,
    members: [
      {
        userId: userId,
        roles: MemberRole.OWNER,
      },
    ],
    plan: {
      name: PlanName.FREE,
      subscriptionType: SubscriptionType.MONTHLY,
      creditsMonth: 0,
    },
    credits: 0,
  });

  await space.save();

  await addSpaceToUser(userId, space._id);

  return space;
};

