import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { adminUsers, db } from "@/db";

export const { auth, signIn, signOut, handlers } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, email))
          .limit(1);

        if (!user) {
          return null;
        }

        const passwordMatches = await compare(password, user.password_hash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
});
