import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

const MAX_MESSAGE_LENGTH = 2000;

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
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return NextResponse.json(messages.reverse());
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await params;
  if (!(await canAccessProject(projectId, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Parsed separately so a malformed body is a client error, and a failure in
  // the write below is not reported as one.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawContent = (body as { content?: unknown } | null)?.content;
  if (typeof rawContent !== "string") {
    return NextResponse.json({ error: "Message content must be a string" }, { status: 400 });
  }

  const content = rawContent.trim();
  if (!content) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    const message = await prisma.message.create({
      data: { projectId, senderId: user.id, content },
      include: { sender: { select: { name: true } } },
    });
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
