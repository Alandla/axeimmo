import NextAuth from "next-auth"
import connectMongo from "./mongo"
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import google from "next-auth/providers/google"
import { createPrivateSpaceForUser } from "../dao/spaceDao";
import { createUser, isUserExist } from "../dao/userDao";

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
          options: {
            lang: "fr",
          },
        };
      },
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    }
  },
  adapter: MongoDBAdapter(connectMongo) as any,
  pages: {
    signIn: '/',
  },
  events: {
    createUser: async (user) => {
      if (user.user.name && user.user.id) {
        await createPrivateSpaceForUser(user.user.id, user.user.name);
      }
    },
  },
});
