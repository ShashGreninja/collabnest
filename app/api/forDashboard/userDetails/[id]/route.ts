import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isAdmin, publicUserSelect, selfUserSelect } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const isSelf = authUser.id === id || isAdmin(authUser);
        const user = await prisma.user.findUnique({
            where: { id },
            select: isSelf ? selfUserSelect : publicUserSelect,
        });
        if (!user) return NextResponse.json({ error: 'User not found' },{status:404});
        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        return NextResponse.json({ error: 'Server error' },{status:500});
    }
}
