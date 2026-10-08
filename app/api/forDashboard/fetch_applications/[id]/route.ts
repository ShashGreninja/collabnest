import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id }, select: { authorId: true } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (user.role !== 'ADMIN' && project.authorId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const applications = await prisma.application.findMany({
    where: { projectId: id, status: 'PENDING' },
    include: { applicant: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(applications, { status: 200 });
}
