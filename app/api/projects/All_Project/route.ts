import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth';

//function to fetch alll projects

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    const projects = await prisma.project.findMany({
      include: {
        applications: { select: { id: true, status: true, applicantId: true } },
      },
    });

    // Hide who applied: only the caller's own application keeps its applicantId
    // (project authors / admins see their own projects' applicants).
    const sanitized = projects.map((project) => {
      const canSeeAll = !!authUser && (isAdmin(authUser) || project.authorId === authUser.id);
      return {
        ...project,
        applications: project.applications.map((a) => ({
          id: canSeeAll || a.applicantId === authUser?.id ? a.id : null,
          status: a.status,
          applicantId: canSeeAll || a.applicantId === authUser?.id ? a.applicantId : null,
        })),
      };
    });

    return NextResponse.json(sanitized, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
