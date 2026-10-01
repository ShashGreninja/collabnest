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

// Same derivation as app/api/addUser/route.ts so first-login upsert
// produces an identical row even if /welcome is skipped.
function extractProgramCode(rollNumber: string) {
  return rollNumber.substring(2, 4).toUpperCase();
}

function getProgramName(rollNumber: string): string {
  const programs: Record<string, string> = {
    '01': 'BTech',
    '02': 'MTech',
    '11': 'BSc',
    '12': 'MSc',
  };
  const fourYear: string[] = ['CS', 'AI', 'EE', 'EC', 'MC', 'CB', 'CE', 'ME', 'MM', 'EP', 'CT'];
  const programCode = extractProgramCode(rollNumber);
  const branch = extractBranch(rollNumber);
  if (programCode === '01' && !fourYear.includes(branch)) {
    return 'Dual Degree 5 Years';
  }
  return programs[programCode] || 'Unknown Program';
}

function extractBranch(rollNumber: string) {
  return rollNumber.substring(4, 6).toUpperCase();
}

function extractDepartment(branch: string) {
  const branchToDepartment: Record<string, string> = {
    CS: 'Computer Science and Engineering',
    AI: 'Computer Science and Engineering',
    EE: 'Electrical Engineering',
    EC: 'Electrical Engineering',
    VL: 'Electrical Engineering',
    PC: 'Electrical Engineering',
    CM: 'Electrical Engineering',
    MC: 'Mathematics',
    CB: 'Chemical Engineering',
    CT: 'Chemical Engineering',
    CE: 'Civil Engineering',
    GT: 'Civil Engineering',
    ST: 'Civil Engineering',
    ME: 'Mechanical Engineering',
    MM: 'Metallurgical and Materials Engineering',
    EP: 'Engineering Physics',
  };
  return branchToDepartment[branch] || 'No Mapped Department';
}

function extractRollFromEmail(email: string) {
  const userId = email.split('@')[0];
  const isFirstPartInt = !isNaN(parseInt(userId[0]));
  return isFirstPartInt ? userId.split('_')[0].toUpperCase() : userId.split('_')[1].toUpperCase();
}

function extractStartingYear(rollNumber: string) {
  const yearPrefix = rollNumber.substring(0, 2);
  return (2000 + parseInt(yearPrefix, 10)).toString();
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
    async signIn({ profile }) {
      if (!profile?.email?.endsWith('@iitp.ac.in')) {
        return false;
      }
      // Ensure a DB row always exists on first login so callers never 404.
      // /welcome still calls /api/addUser (idempotent) as a backup.
      try {
        const email = profile.email as string;
        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (!existing) {
          const roll = extractRollFromEmail(email);
          const branch = extractBranch(roll);
          await prisma.user.create({
            data: {
              name: (profile.name as string) || email.split('@')[0],
              email,
              roll,
              branch,
              degree: getProgramName(roll),
              year: extractStartingYear(roll),
              department: extractDepartment(branch),
            },
          });
        }
      } catch {
        // Never block auth on DB failure — /api/addUser will retry from /welcome
      }
      return true;
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
