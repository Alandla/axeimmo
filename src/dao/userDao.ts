import { User } from "next-auth";
import connectMongo from "../lib/mongoose";
import UserModel from "../models/User";

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
    const user = await UserModel.findById(userId);
    user.spaces.push(spaceId);
    await user.save();
  } catch (error) {
    console.error("Error while adding space to user: ", error);
    throw error;
  }
};
    
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