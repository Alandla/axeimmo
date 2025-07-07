import NextAuth from "next-auth"
import connectMongo from "./mongo"
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import google from "next-auth/providers/google"
import { createPrivateSpaceForUser } from "../dao/spaceDao";
import { addUserIdToContact, createContact, sendVerificationRequest } from "./loops";
import isDisposableEmail from "./mail";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    google({
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name.split(" ")[1],
          firstName: profile.name.split(" ")[0],
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
    async signIn({ user, account }) {
      console.log("Sign in event: ", user);
      if (user.email) {
        const isDisposable = await isDisposableEmail(user.email);
        if (isDisposable) {
          return "/auth/error?error=disposable-email";
        }

        if (user.options === undefined) {
          const contactProperties = {
            firstName: user.firstName || user.name,
            videosCount: 0,
            videosExported: 0
          };
          try {
            await createContact(user.email, contactProperties);
          } catch (error) {
            return "/auth/error?error=contact-creation";
          }
        }

        return true;
      }
      return "/auth/error?error=invalid-email";
    }
  },
  adapter: MongoDBAdapter(connectMongo) as any,
  pages: {
    signIn: '/',
  },
  events: {
    signIn: async (user) => {
      console.log("Sign in event: ", user);
    },
    createUser: async (user) => {
      console.log("Create user event: ", user);
      if (user.user.id && user.user.email) {
        await addUserIdToContact(user.user.id, user.user.email);
        await createPrivateSpaceForUser(user.user.id, user?.user?.firstName || user?.user?.name);
      }
    },
  },
});
