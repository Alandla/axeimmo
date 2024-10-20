import UserModel from "../models/User";
import SpaceModel from "../models/Space";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";
import connectMongo from "../lib/mongoose";
import { addSpaceToUser } from "./userDao";

export const createPrivateSpaceForUser = async (userId: string, userName: string) => {
  await connectMongo();

  const spaceName = userName ? `${userName}'s Private Space` : "Private Space";

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

export const getUserSpaces = async (userId: string) => {
  await connectMongo();

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const spaces = await SpaceModel.find(
      { _id: { $in: user.spaces } },
      'name plan credits members'
    );

    return spaces.map((space) => {
      const userRole = space.members.find((member: any) => member.userId.toString() === userId)?.roles;
      return {
        name: space.name,
        planName: space.plan.name,
        credits: space.credits,
        creditsPerMonth: space.plan.creditsMonth,
        userRole: userRole,
      };
    });
  } catch (error) {
    console.error("fetchingUserSpaces", error);
    throw error;
  }
};
