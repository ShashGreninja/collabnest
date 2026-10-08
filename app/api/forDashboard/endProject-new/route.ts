import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { earnedBadgeKeys } from '@/lib/badges';

function getNewRating(oldRating: number, score: number, toughness: number): number {
  let p = 2000;
  if (toughness === 1) {
    p = 800;
  } else if (toughness === 2) {
    p = 1400;
  }
  score = score / 10;

  const a = 2 * score - 1;
  const b = 1.0 / (1.0 + Math.pow(10, (p - oldRating) / 400.0));

  let k = 10;
  if (oldRating < 1200) {
    k = a - b >= 0 ? 40 : 20;
  } else if (oldRating < 1800) {
    k = 20;
  }

  let r = a - b > 0 && oldRating - p > 200 ? 0.5 : 1;
  return (a - b) * 3.0 * k * r + oldRating;
}

// BUG FIX 1.2: Require auth and project ownership before ending a project and changing ratings
export async function POST(request: NextRequest) {
  // --- Authentication ---
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId, ratings } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // --- Authorization: only the project author or ADMIN may end a project ---
    const projectCheck = await prisma.project.findUnique({
      where: { id: projectId },
      select: { authorId: true, status: true, members: { select: { userId: true } } },
    });

    if (!projectCheck) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (authUser.role !== 'ADMIN' && projectCheck.authorId !== authUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: you are not the author of this project' },
        { status: 403 }
      );
    }

    if (projectCheck.status === 'CLOSED') {
      return NextResponse.json({ error: 'Project is already closed' }, { status: 409 });
    }
    if (ratings !== undefined && (!ratings || typeof ratings !== 'object' || Array.isArray(ratings))) {
      return NextResponse.json({ error: 'Ratings must be an object' }, { status: 400 });
    }
    const contributorIds = new Set(projectCheck.members.map((member) => member.userId));
    if (ratings) {
      for (const [userId, score] of Object.entries(ratings)) {
        if (!contributorIds.has(userId)) {
          return NextResponse.json({ error: 'Ratings may only be submitted for project members' }, { status: 400 });
        }
        if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 10) {
          return NextResponse.json({ error: 'All rating scores must be numbers between 0 and 10' }, { status: 400 });
        }
      }
    }
    console.log('Received project ID:', projectId);
    console.log('Ratings:', ratings);

    const result = await prisma.$transaction(async (tx) => {
      // Update project status
      const closeResult = await tx.project.updateMany({
        where: { id: projectId, status: { not: 'CLOSED' } },
        data: { status: 'CLOSED' },
      });
      if (closeResult.count === 0) throw new Error('PROJECT_ALREADY_CLOSED');
      const updatedProject = await tx.project.findUniqueOrThrow({ where: { id: projectId } });

      // Fetch difficultyTag properly
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { difficultyTag: true },
      });

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found.`);
      }

      // Map difficultyTag enum to numeric toughness
      const difficultyMapping: Record<string, number> = {
        BEGINNER: 1,
        INTERMEDIATE: 2,
        ADVANCED: 3,
      };

      const toughness = difficultyMapping[project.difficultyTag] ?? 2;

      // Update user ratings
      for (const [userId, score] of Object.entries(ratings || {})) {
        const validScore = Math.min(Math.max(Number(score), 0), 10);

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { rating: true },
        });

        if (!user) {
          console.warn(`User ${userId} not found, skipping rating update.`);
          continue;
        }

        const newRating = Math.round(getNewRating(user.rating, validScore, toughness));
        console.log(`Updating rating for user ${userId}: Old=${user.rating}, New=${newRating}`);

        await tx.user.update({
          where: { id: userId },
          data: { rating: newRating },
        });

        await tx.projectMember.updateMany({
          where: { projectId, userId },
          data: { score: validScore, completedAt: new Date() },
        });
      }

      // Mark ALL members as completed (rated members already got completedAt above).
      // badges.ts counts every closed-project membership, so persistence must match.
      await tx.projectMember.updateMany({
        where: { projectId, completedAt: null },
        data: { completedAt: new Date() },
      });

      for (const userId of contributorIds) {
        const member = await tx.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            applications: { select: { id: true } },
            projectCreated: { select: { status: true } },
            projectsParticipated: {
              select: {
                score: true,
                project: {
                  select: { status: true, difficultyTag: true, requirementTags: true },
                },
              },
            },
            _count: { select: { sentMessages: true, assignedSubtasks: true } },
          },
        });

        if (!member) continue;

        const keys = earnedBadgeKeys({
          role: member.role,
          applications: member.applications,
          projectCreated: member.projectCreated,
          projectsParticipated: member.projectsParticipated as {
            project: { status: string; difficultyTag: any; requirementTags: string[] };
          }[],
          messageCount: member._count.sentMessages,
          assignedSubtaskCount: member._count.assignedSubtasks,
          memberScores: member.projectsParticipated
            .map((p: { score: number | null }) => p.score)
            .filter((score: number | null): score is number => score !== null),
          isRankOne: false,
        });

        await tx.userBadge.createMany({
          data: keys.map((badgeKey) => ({ userId, badgeKey })),
          skipDuplicates: true,
        });
      }

      return updatedProject;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'PROJECT_ALREADY_CLOSED') return NextResponse.json({ error: 'Project is already closed' }, { status: 409 });
    console.error('Error ending project:', error);
    return NextResponse.json(
      {
        error: 'Failed to end project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
