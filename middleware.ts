import NextAuth from "next-auth";
import { authConfg } from "./auth.config";

export default NextAuth(authConfg).auth;

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};