import UserModel from "../models/User";
import SpaceModel from "../models/Space";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";
import connectMongo from "../lib/mongoose";
import { addSpaceToUser } from "./userDao";
import { IMedia } from "../types/video";

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

export const addMediasToSpace = async (spaceId: string, medias: IMedia[]) => {
  await connectMongo();
  try {
    const space = await getSpaceById(spaceId);
    if (!space.medias) {
      space.medias = [];
    }
    space.medias.push(...medias);
    await space.save();
    return space.medias;
  } catch (error) {
    console.error("Error while adding medias to space: ", error);
    throw error;
  }
}

export const removeCreditsToSpace = async (spaceId: string, credits: number) => {
  await connectMongo();
  try {
    const space = await getSpaceById(spaceId);
    space.credits -= credits;
    await space.save();
  } catch (error) {
    console.error("Error while removing credits from space: ", error);
    throw error;
  }
}

export const addCreditsToSpace = async (spaceId: string, credits: number) => {
  await connectMongo();
  try {
    const space = await getSpaceById(spaceId);
    space.credits += credits;
    await space.save();
  } catch (error) {
    console.error("Error while adding credits to space: ", error);
    throw error;
  }
}

export const deleteMediaFromSpace = async (spaceId: string, media: IMedia) => {
  await connectMongo();
  try {
    const space = await getSpaceById(spaceId);
    space.medias = space.medias.filter((m: any) => m.media._id.toString() !== media.id);
    await space.save();
  } catch (error) {
    console.error("Error while deleting media from space: ", error);
    throw error;
  }
}

export const getSpaceById = async (spaceId: string) => {
  await connectMongo();
  try {
    const space = await SpaceModel.findById(spaceId);
    return space;
  } catch (error) {
    console.error("Error while getting space by id: ", error);
    throw error;
  }
}

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
        id: space._id,
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
