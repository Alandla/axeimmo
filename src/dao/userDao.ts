import { executeWithRetry } from "../lib/db";
import { User } from "next-auth";
import UserModel from "../models/User";
import { IUser } from "../types/user";

export const createUser = async (user: User) => {
  try {
    return await executeWithRetry(async () => {
      const initUserData = {
        name: user.name?.split(" ")[1] || "",
        firstName: user.name?.split(" ")[0] || "",
        email: user.email,
        image: user.image,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return await UserModel.create(initUserData);
    });
  } catch (error) {
    console.error("Error while creating user: ", error);
    throw error;
  }
};

export const addSpaceToUser = async (userId: string, spaceId: string) => {
  try {
    return await executeWithRetry(async () => {
      console.log("Adding space to user: ", userId, spaceId);
      const user = await UserModel.findById(userId);
      user.spaces.push(spaceId);
      await user.save();
    });
  } catch (error) {
    console.error("Error while adding space to user: ", error);
    throw error;
  }
};

export const isUserInSpace = async (userId: string, spaceId: string) => {
  try {
    return await executeWithRetry(async () => {
      const user = await UserModel.findById(userId).select('spaces');
      if (!user) return false;
      return user.spaces.includes(spaceId);
    });
  } catch (error) {
    console.error("Error while checking if user is in space: ", error);
    throw error;
  }
}

export const isUserExist = async (email: string) => {
  try {
    return await executeWithRetry(async () => {
      return await UserModel.findOne({ email });
    });
  } catch (error) {
    console.error("Error while checking if user exists: ", error);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  try {
    return await executeWithRetry(async () => {
      return await UserModel.findById(userId);
    });
  } catch (error) {
    console.error("Error while getting user by id: ", error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    return await executeWithRetry(async () => {
      return await UserModel.findOne({ email });
    });
  } catch (error) {
    console.error("Error while getting user by email: ", error);
    throw error;
  }
};

export const updateUser = async (userId: string, updateData: Partial<IUser>) => {
  try {
    return await executeWithRetry(async () => {
      return await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
    });
  } catch (error) {
    console.error("Error while updating user: ", error);
    throw error;
  }
}

export const addDefaultDataToUser = async (userId: string) => {
  try {
    return await executeWithRetry(async () => {
      const user = await UserModel.findById(userId);
      user.createdAt = new Date();
      user.updatedAt = new Date();
      user.options = {
        lang: "en",
      };
      await user.save();
    });
  } catch (error) {
    console.error("Error while adding default data to user: ", error);
    throw error;
  }
}