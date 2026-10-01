import { NextAuthOptions } from "next-auth";
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from "@/lib/prisma";

// Extend the built-in session / token / profile types
declare module "next-auth" {
  interface Profile {
    oid: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    oid?: string;
    dbId?: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (profile?.email?.endsWith('@iitp.ac.in')) {
        return true;
      }
      return false;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.oid = profile.oid!;
        token.email = profile.email;
        token.name = profile.name;
      }

      // On every token refresh, look up the database user to get id + role
      if (token.email && !token.dbId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.dbId = dbUser.id;
            token.role = dbUser.role;
          }
        } catch {
          // DB lookup failure should not block auth
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.dbId as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
        };
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
/* vi: set et sw=2: */
