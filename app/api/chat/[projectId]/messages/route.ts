import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

async function canAccessProject(projectId: string, user: { id: string; role: string }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { authorId: true, members: { where: { userId: user.id }, select: { id: true } } },
  });
  return !!project && (user.role === "ADMIN" || project.authorId === user.id || project.members.length > 0);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await params;
  if (!(await canAccessProject(projectId, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const messages = await prisma.message.findMany({
    where: { projectId },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await params;
  if (!(await canAccessProject(projectId, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }
    const message = await prisma.message.create({
      data: { projectId, senderId: user.id, content: body.content.trim() },
      include: { sender: { select: { name: true } } },
    });
    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
