import NextAuth from "next-auth"
import connectMongo from "./mongo"
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import google from "next-auth/providers/google"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    google
  ],
  adapter: MongoDBAdapter(connectMongo),
  pages: {
    signIn: '/',
  },
})