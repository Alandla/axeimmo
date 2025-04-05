import { executeWithRetry } from "../lib/db";
import UserModel from "../models/User";
import SpaceModel from "../models/Space";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";
import { addSpaceToUser } from "./userDao";
import { IMedia } from "../types/video";
import { IMediaSpace, IPlan } from "../types/space";

export const createPrivateSpaceForUser = async (userId: string, userName?: string | null) => {
  return executeWithRetry(async () => {
    const spaceName = userName ? `${userName}'s Private Space` : "Private Space";

    const space = new SpaceModel({
      name: spaceName,
      members: [{ userId: userId, roles: MemberRole.OWNER }],
      plan: {
        name: PlanName.FREE,
        subscriptionType: SubscriptionType.MONTHLY,
        creditsMonth: 10,
      },
      credits: 10,
    });

    await space.save();
    console.log("Space created: ", space);
    await addSpaceToUser(userId, space._id);
    return space;
  });
};

export const addMediasToSpace = async (spaceId: string, medias: IMediaSpace[]) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      if (!space.medias) space.medias = [];
      space.medias.push(...medias);
      await space.save();
      return space.medias;
    });
  } catch (error) {
    console.error("Error while adding medias to space: ", error);
    throw error;
  }
}

export const updateSpacePlan = async (spaceId: string, plan: Partial<IPlan>) => {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findByIdAndUpdate(spaceId, { $set: { plan } }, { new: true });
      if (!space) throw new Error("Space not found");
      return space.plan;
    });
  } catch (error) {
    console.error("Error while updating space plan: ", error);
    throw error;
  }
}

export const removeSubtitleStyleFromSpace = async (spaceId: string, subtitleStyleId: string) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      space.subtitleStyle = space.subtitleStyle.filter((style: any) => style._id.toString() !== subtitleStyleId);
      await space.save();
      return space.subtitleStyle;
    });
  } catch (error) {
    console.error("Error while removing subtitle style from space: ", error);
    throw error;
  }
}

export const updateSubtitleStyleToSpace = async (spaceId: string, subtitleStyle: any, subtitleStyleId: string) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      const subtitleStyleIndex = space.subtitleStyle.findIndex((style: any) => style._id.toString() === subtitleStyleId);
      if (subtitleStyleIndex === -1) throw new Error("Subtitle style not found");
      
      space.subtitleStyle[subtitleStyleIndex] = {
        ...space.subtitleStyle[subtitleStyleIndex],
        style: subtitleStyle.style,
        name: subtitleStyle.name
      };
      await space.save();
      return space.subtitleStyle;
    });
  } catch (error) {
    console.error("Error while adding subtitle style to space: ", error);
    throw error;
  }
}

export const addSubtitleStyleToSpace = async (spaceId: string, subtitleStyle: any) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      if (!space.subtitleStyle) space.subtitleStyle = [];
      
      const name = "Title " + (space.subtitleStyle.length + 1);
      const preset = { name, style: subtitleStyle };
      space.subtitleStyle.push(preset);
      await space.save();
      return space.subtitleStyle;
    });
  } catch (error) {
    console.error("Error while adding subtitle style to space: ", error);
    throw error;
  }
}

export const removeCreditsToSpace = async (spaceId: string, credits: number) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      space.credits -= credits;
      await space.save();
    });
  } catch (error) {
    console.error("Error while removing credits from space: ", error);
    throw error;
  }
}

export const addCreditsToSpace = async (spaceId: string, credits: number) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      space.credits += credits;
      await space.save();
    });
  } catch (error) {
    console.error("Error while adding credits to space: ", error);
    throw error;
  }
}

export const setCreditsToSpace = async (spaceId: string, credits: number) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      space.credits = credits;
      await space.save();
      return space.credits;
    });
  } catch (error) {
    console.error("Error while setting credits to space: ", error);
    throw error;
  }
}

export const deleteMediaFromSpace = async (spaceId: string, media: IMedia) => {
  try {
    return await executeWithRetry(async () => {
      const space = await getSpaceById(spaceId);
      space.medias = space.medias.filter((m: any) => m.media._id.toString() !== media.id);
      await space.save();
      return space.medias;
    });
  } catch (error) {
    console.error("Error while deleting media from space: ", error);
    throw error;
  }
}

export const getSpaceById = async (spaceId: string) => {
  try {
    return await executeWithRetry(async () => {
      return await SpaceModel.findById(spaceId);
    });
  } catch (error) {
    console.error("Error while getting space by id: ", error);
    throw error;
  }
}

export const getUserSpaces = async (userId: string) => {
  try {
    return await executeWithRetry(async () => {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error("User not found");

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
    });
  } catch (error) {
    console.error("fetchingUserSpaces", error);
    throw error;
  }
};

export const updateSpaceLastUsed = async (
  spaceId: string,
  voiceId?: string | null,
  avatarId?: string | null,
  subtitleId?: string | null
) => {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findById(spaceId);
      
      if (!space) throw new Error("Space not found");

      let { voices, avatars, subtitles } = space.lastUsed;
  
      if (voiceId) {
        voices.push(voiceId);
        if (voices.length > 5) {
          voices.pop();
        }
      }
      if (avatarId) {
        avatars.push(avatarId);
        if (avatars.length > 5) {
          avatars.pop();
        }
      }
      if (subtitleId) {
        subtitles.push(subtitleId);
        if (subtitles.length > 5) {
          subtitles.pop();
        }
      }

      space.lastUsed = { voices, avatars, subtitles };

      await space.save();
      return space;
    });
  } catch (error) {
    console.error("Error while updating space last used: ", error);
    throw error;
  }
};

export async function updateMedia(spaceId: string, mediaId: string, updates: any) {
  try {
    return await executeWithRetry(async () => {

      const testfind = await SpaceModel.findOne({ _id: spaceId, 'medias._id': mediaId });
      console.log("testfind", testfind)

      const space = await SpaceModel.findOneAndUpdate(
        { 
          _id: spaceId, 
          'medias._id': mediaId 
        },
        { 
          $set: { 'medias.$.media': updates }
        },
        { 
          new: true,
          runValidators: true
        }
      );

      if (!space) {
        throw new Error('Space or media not found');
      }

      const updatedMedia = space.medias.find((m: any) => m.id === mediaId);
      if (!updatedMedia) {
        throw new Error('Updated media not found');
      }

      return updatedMedia;
    });
  } catch (error) {
    console.error("Error while updating media: ", error);
    throw error;
  }
}

export const updateSpaceDetails = async (spaceId: string, details: Record<string, any>) => {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findByIdAndUpdate(
        spaceId, 
        { $set: { details } }, 
        { new: true }
      );
      
      if (!space) throw new Error("Space not found");
      return space.details;
    });
  } catch (error) {
    console.error("Error while updating space details: ", error);
    throw error;
  }
};
