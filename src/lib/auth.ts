import NextAuth from "next-auth"
import connectMongo from "./mongo"
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import google from "next-auth/providers/google"
import { createPrivateSpaceForUser } from "../dao/spaceDao";
import { addDefaultDataToUser, createUser, isUserExist } from "../dao/userDao";
import { addUserIdToContact, createContact, sendVerificationRequest } from "./loops";
import checkBetaAccess from "./beta";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    google({
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.image,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    }),
    {
      id: "http-email",
      name: "Email",
      type: "email",
      maxAge: 60 * 60 * 24, // Email link will expire in 24 hours
      sendVerificationRequest: async (params) => {
        await sendVerificationRequest({
          identifier: params.identifier,
          url: params.url
        });
      },
    },
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user }) {
      console.log("Sign in event: ", user);
      if (user.email) {
        let hasBetaAccess = await checkBetaAccess(user.email);
        if (hasBetaAccess && user.options === undefined) {
          const contactProperties = {
            firstName: user.name,
            videosCount: 0
          };
          await createContact(user.email, contactProperties);
          return true;
        }
        return hasBetaAccess;
      }
      return false;
    }
  },
  adapter: MongoDBAdapter(connectMongo) as any,
  pages: {
    signIn: '/',
  },
  events: {
    createUser: async (user) => {
      console.log("Create user event: ", user);
      if (user.user.id && user.user.email) {
        await addUserIdToContact(user.user.id, user.user.email);
        await createPrivateSpaceForUser(user.user.id, user?.user?.name);
      }
    },
  },
});
