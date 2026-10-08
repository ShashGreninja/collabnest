import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Full application details only for the user themselves or an admin;
    // everyone else just sees how many applications exist.
    const isSelf = authUser.id === id || isAdmin(authUser);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true, // Include only necessary fields
        name: true,  
        roll: true,
        role: true,
        department: true,
        branch: true,
        degree: true,
        rating: true,
        picture: true,
        applications: isSelf ? true : { select: { id: true } },
        projectCreated: true,
        projectsParticipated: {
          include:{
            project:true
          }
        },
        badges: { select: { badgeKey: true, awardedAt: true } },
        _count: { select: { sentMessages: true, assignedSubtasks: true } }// Add more attributes as needed
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
