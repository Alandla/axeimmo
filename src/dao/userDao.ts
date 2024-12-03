import { User } from "next-auth";
import connectMongo from "../lib/mongoose";
import UserModel from "../models/User";
import { IUser } from "../types/user";

export const createUser = async (user: User) => {
  await connectMongo();
  try {
    const initUserData = {
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newUser = await UserModel.create(initUserData);
    return newUser;
  } catch (error) {
    console.error("Error while creating user: ", error);
    throw error;
  }
};

export const addSpaceToUser = async (userId: string, spaceId: string) => {
  await connectMongo();
  try {
    console.log("Adding space to user: ", userId, spaceId);
    const user = await UserModel.findById(userId);
    user.spaces.push(spaceId);
    await user.save();
  } catch (error) {
    console.error("Error while adding space to user: ", error);
    throw error;
  }
};

export const isUserInSpace = async (userId: string, spaceId: string) => {
  await connectMongo();
  try {
    const user = await UserModel.findById(userId);
    return user.spaces.includes(spaceId);
  } catch (error) {
    console.error("Error while checking if user is in space: ", error);
    throw error;
  }
}

export const isUserExist = async (email: string) => {
  await connectMongo();
  try {
    const user = await UserModel.findOne({ email });
    return user;
  } catch (error) {
    console.error("Error while checking if user exists: ", error);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  await connectMongo();
  try {
    const user = await UserModel.findById(userId);
    return user;
  } catch (error) {
    console.error("Error while getting user by id: ", error);
    throw error;
  }
};

export const updateUser = async (userId: string, updateData: Partial<IUser>) => {
  await connectMongo();
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
    return updatedUser;
  } catch (error) {
    console.error("Error while updating user: ", error);
    throw error;
  }
}

export const addDefaultDataToUser = async (userId: string) => {
  await connectMongo();
  try {
    const user = await UserModel.findById(userId);
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.options = {
      lang: "fr",
    };
    await user.save();
  } catch (error) {
    console.error("Error while adding default data to user: ", error);
    throw error;
  }
}