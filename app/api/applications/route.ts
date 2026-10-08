import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId");
  try {
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (user.role !== "ADMIN" && project.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const applications = await prisma.application.findMany({ where: { projectId }, include: { applicant: { select: { id: true, name: true, email: true } } } });
      return NextResponse.json(applications, { status: 200 });
    }
    const applications = await prisma.application.findMany({ where: { applicantId: user.id }, include: { applicant: { select: { id: true, name: true, email: true } } } });
    return NextResponse.json(applications, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Define request body type
interface RequestBody {
  action: "apply" | "withdraw" | "accept" | "reject";
  applicantId: string;
  projectId: string;
}

// Define response type
interface ApiResponse {
  message?: string;
  error?: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RequestBody = await req.json();

    if (!body.action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Ensure applicantId matches authenticated user unless ADMIN
    const applicantId = body.applicantId || authUser.id;
    if (authUser.role !== "ADMIN" && applicantId !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: cannot apply or withdraw on behalf of another user" },
        { status: 403 }
      );
    }

    if (body.action === "apply") {
      return await applyToProject(applicantId, body.projectId);
    }

    if (body.action === "withdraw") {
      return await withdrawFromProject(applicantId, body.projectId);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Function to apply for a project
async function applyToProject(applicantId: string, projectId: string): Promise<NextResponse<ApiResponse>> {
  if (!applicantId || !projectId) return NextResponse.json({ error: "User ID and Project ID are required" }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error("PROJECT_NOT_FOUND");
      if (project.status === "CLOSED") throw new Error("PROJECT_CLOSED");
      if (project.deadlineToApply && new Date() > project.deadlineToApply) throw new Error("DEADLINE_PASSED");
      const [existing, membership, count] = await Promise.all([
        tx.application.findFirst({ where: { applicantId, projectId } }),
        tx.projectMember.findFirst({ where: { userId: applicantId, projectId } }),
        tx.application.count({ where: { projectId, status: { in: ["PENDING", "ACCEPTED"] } } }),
      ]);
      if (existing) throw new Error("ALREADY_APPLIED");
      if (membership) throw new Error("ALREADY_MEMBER");
      if (count >= project.applicantCapacity) throw new Error("CAPACITY_FULL");
      await tx.application.create({ data: { applicantId, projectId } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ message: "Applied to project successfully!" }, { status: 200 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "PROJECT_NOT_FOUND") return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (code === "DEADLINE_PASSED") return NextResponse.json({ error: "The deadline to apply for this project has passed" }, { status: 400 });
    if (code === "CAPACITY_FULL") return NextResponse.json({ error: "Project has reached its applicant capacity" }, { status: 409 });
    if (["ALREADY_APPLIED", "ALREADY_MEMBER", "PROJECT_CLOSED"].includes(code)) return NextResponse.json({ error: code === "PROJECT_CLOSED" ? "Project is closed" : "User has already applied or joined this project" }, { status: 409 });
    if ((error as { code?: string })?.code === "P2034") return NextResponse.json({ error: "Project capacity changed; please try again" }, { status: 409 });
    console.error("Failed to apply to project", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Function to withdraw from a project
async function withdrawFromProject(applicantId: string, projectId: string): Promise<NextResponse<ApiResponse>> {
  if (!applicantId || !projectId) {
    return NextResponse.json({ error: "User ID and Project ID are required" }, { status: 400 });
  }

  // Delete the application entry
  const application = await prisma.application.findFirst({
    where: {
      applicantId: applicantId,
      projectId: projectId,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Delete the found application
  await prisma.application.delete({ where: { id: application.id } });

  // Optionally, remove the user from project members if they were added
  const projectMember = await prisma.projectMember.findFirst({
    where: {
      userId: applicantId,
      projectId: projectId,
    },
  });
  if (projectMember) {
    await prisma.projectMember.delete({ where: { id: projectMember.id } });
    // Capacity is tracked by counting rows, no field to update
  }

  return NextResponse.json({ message: "Withdrawn from project successfully!" }, { status: 200 });
}

// BUG FIX 1.1: Accept / Reject – requires auth + project ownership
export async function PUT(request: NextRequest) {
  // --- Authentication ---
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, projectId, applicationId } = await request.json();

  console.log('Starting application processing:', { action, projectId, applicationId });

  // Input validation
  if (!['accept', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be either "accept" or "reject"' },
      { status: 400 }
    );
  }

  try {
    // --- Authorization: caller must be project author or ADMIN ---
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { authorId: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (authUser.role !== 'ADMIN' && project.authorId !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: you are not the author of this project" },
        { status: 403 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      console.log("Fetching application with ID:", applicationId);

      const application = await tx.application.findUnique({ where: { id: applicationId, projectId },
        include: { project: true, applicant: true }
      });

      if (!application) {
        console.log("Application not found!");
        throw new Error("Application not found");
      }

      console.log("Current application status:", application.status);

      if (application.project.status === 'CLOSED') {
        throw new Error("PROJECT_CLOSED");
      }

      if (application.status !== 'PENDING') {
        console.log("Application is not pending. Current status:", application.status);
        throw new Error("Application is not in pending state");
      }

      console.log("Updating application status to:", action === 'accept' ? 'ACCEPTED' : 'REJECTED');

      await tx.application.update({
        where: { id: applicationId },
        data: {
          status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
        }
      });

      console.log("Application status updated successfully!");

      if (action === 'accept') {
        console.log("Adding user to project members...");

        const selectionUpdate = await tx.project.updateMany({
          where: { id: projectId, selectionCapacity: { gt: 0 }, status: { not: 'CLOSED' } },
          data: { selectionCapacity: { decrement: 1 } },
        });
        if (selectionUpdate.count === 0) throw new Error("NO_SELECTION_CAPACITY");
        await tx.projectMember.create({
          data: {
            projectId,
            userId: application.applicantId
          }
        });

        console.log("User added to project members.");
      }

      return { success: true };
    });

    if (result) {
      return NextResponse.json(result);
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'NO_SELECTION_CAPACITY') return NextResponse.json({ error: 'Project has no remaining selection capacity' }, { status: 409 });
    if (error instanceof Error && error.message === 'PROJECT_CLOSED') return NextResponse.json({ error: 'Project is closed' }, { status: 409 });
    console.error('Error processing application:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred while processing application' },
      { status: 500 }
    );
  }
}