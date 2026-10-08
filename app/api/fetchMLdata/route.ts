import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth';

// Helper function to map difficulty to numerical values
const mapDifficulty = (difficulty: string) => {
    if (difficulty === 'ADVANCED') return 3;
    if (difficulty === 'INTERMEDIATE') return 2;
    return 1; // Default is BEGINNER
};

export async function GET(req: NextRequest) {
    // Machine-to-machine endpoint: require x-ml-api-key === ML_API_KEY, or an admin session.
    const expectedKey = process.env.ML_API_KEY;
    const providedKey = req.headers.get('x-ml-api-key');
    const keyOk = !!expectedKey && !!providedKey && providedKey.length === expectedKey.length
        && timingSafeEqual(Buffer.from(providedKey), Buffer.from(expectedKey));
    if (!keyOk) {
        const authUser = await getAuthenticatedUser();
        if (!isAdmin(authUser)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    try {
        console.log('Connecting to database...');
        const Users = await prisma.user.findMany({
            where: { role: 'USER' }, // Filter users with role USER
            select: {
                id: true,
                rating: true,
                projectsParticipated: {
                    select: {
                        project: {
                            select: {
                                requirementTags: true,
                                difficultyTag: true
                            }
                        }
                    }
                },
                applications: {
                    select: {
                        project: {
                            select: {
                                requirementTags: true,
                                difficultyTag: true
                            }
                        }
                    }
                }
            }
        });

        const user_data = Users.map(user => ({
            user_id: user.id,
            score: user.rating,
            past_project_domains_done: [...new Set(user.projectsParticipated.flatMap(part => part.project.requirementTags))],
            difficulty_done: [...new Set(user.projectsParticipated.map(part => mapDifficulty(part.project.difficultyTag)))],
            past_project_domains_applied: [...new Set(user.applications.flatMap(app => app.project.requirementTags))],
            difficulty_applied: [...new Set(user.applications.map(app => mapDifficulty(app.project.difficultyTag)))],
        }));

        const Projects = await prisma.project.findMany({
            where: {
                status: { in: ["OPEN", "IN_PROGRESS"] }
            },
            select: {
                id: true,
                requirementTags: true,
                difficultyTag: true,
            }
        });

        const project_data = Projects.map(project => ({
            project_id: project.id,
            domains_required: project.requirementTags,
            difficulty_required: mapDifficulty(project.difficultyTag),
        }));

        return NextResponse.json(
            {
                user_data: user_data,
                project_data: project_data
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
