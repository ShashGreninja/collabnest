import { NextResponse, NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { canAccessProject, getAuthenticatedUser, getOwnedProject, publicUserSelect } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Only project author, members, or admins may see the member list
    if (!(await canAccessProject(authUser, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch Project Members directly from the database (safe user fields only)
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: { select: { ...publicUserSelect, email: true } },
        project: true,
      },
    });


    return NextResponse.json(projectMembers, { status: 200 }); 

  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // remove user from project members

    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Only the project author or an admin may remove members
    const project = await getOwnedProject(authUser, id);
    if (!project) {
      return NextResponse.json({ error: "Project not found or forbidden" }, { status: 403 });
    }
    if (project.status === "CLOSED") {
      return NextResponse.json({ error: "Project is closed" }, { status: 409 });
    }

    // search user in project members
    const projectMember = await prisma.projectMember.findFirst({
      where: { userId, projectId: id },
    });

    if (!projectMember) {
      return NextResponse.json({ error: "User is not a project member" }, { status: 404 });
    }
    // Remove user from project members     
    await prisma.projectMember.delete({
      where: { id: projectMember.id },
    });
    
    return NextResponse.json({ message: "User removed from project members" }, { status: 200 });
    
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

