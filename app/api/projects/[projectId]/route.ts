import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin, publicUserSelect } from "@/lib/auth";

// GET: Fetch project details by ID
export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> })
{
  try {
    const { projectId } = await params;
    // console.log("Project ID:", projectId);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        // Author contact email is intentionally shown (used by the UI); no secrets.
        author: { select: { ...publicUserSelect, email: true } },
        subtasks: true,
        applications: { select: { id: true, status: true, applicantId: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Hide other applicants' identities unless caller is the author / admin
    const canSeeAll = !!authUser && (isAdmin(authUser) || project.authorId === authUser.id);
    const sanitized = {
      ...project,
      applications: project.applications.map((a) => {
        const visible = canSeeAll || a.applicantId === authUser?.id;
        return { id: visible ? a.id : null, status: a.status, applicantId: visible ? a.applicantId : null };
      }),
    };

    return NextResponse.json(sanitized, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
/* vi: set et sw=2: */
