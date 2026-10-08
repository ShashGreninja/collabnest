import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { email: rawEmail } = await params;
    const email = rawEmail ? decodeURIComponent(rawEmail) : rawEmail;

    if (!email) {
      return NextResponse.json({ error: 'User Email is required' }, { status: 400 });
    }

    const isSelf = authUser.email === email || isAdmin(authUser);

    const user = await prisma.user.findUnique({
      where: { email },
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
        projectsParticipated: true// Add more attributes as needed
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
