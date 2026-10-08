import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

/**
 * Returns the authenticated DB user, or null if not logged in.
 * Use this in every Route Handler that mutates data.
 */
export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true, name: true },
  });

  return user;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;

/** Public-safe user fields. Never expose password / reset tokens / cv / email publicly. */
export const publicUserSelect = {
  id: true,
  name: true,
  picture: true,
  role: true,
  department: true,
  branch: true,
  degree: true,
  roll: true,
  rating: true,
} as const;

/** Fields a user may see about themselves (adds email + cv, still no secrets). */
export const selfUserSelect = {
  ...publicUserSelect,
  email: true,
  cv: true,
} as const;

export function isAdmin(user: AuthUser | null) {
  return user?.role === "ADMIN";
}

/** Returns project (id, authorId, status) if user is author or admin; otherwise null. */
export async function getOwnedProject(user: AuthUser, projectId: string) {
  if (!projectId || typeof projectId !== "string") return null;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, authorId: true, status: true },
  });
  if (!project) return null;
  if (!isAdmin(user) && project.authorId !== user.id) return null;
  return project;
}

/** True if user is author, admin or a member of the project. */
export async function canAccessProject(user: AuthUser, projectId: string) {
  if (!projectId || typeof projectId !== "string") return false;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { authorId: true, members: { where: { userId: user.id }, select: { id: true } } },
  });
  if (!project) return false;
  return isAdmin(user) || project.authorId === user.id || project.members.length > 0;
}
