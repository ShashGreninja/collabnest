import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    try {
        const applications = await prisma.application.findMany({
            where: { projectId: projectId ?? undefined },
            include: { applicant: true }, // Include user details
        });

        return NextResponse.json(applications, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Define request body type
interface RequestBody {
    action: 'apply' | 'withdraw' | 'accept' | 'reject';
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
        const body: RequestBody = await req.json();

        if (!body.action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        if (body.action === 'apply') {
            return await applyToProject(body.applicantId, body.projectId);
        }

        if (body.action === 'withdraw') {
            return await withdrawFromProject(body.applicantId, body.projectId);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Function to apply for a project
async function applyToProject(applicantId: string, projectId: string): Promise<NextResponse<ApiResponse>> {
    console.log(applicantId, projectId);
    if (!applicantId || !projectId) {
        return NextResponse.json({ error: 'User ID and Project ID are required' }, { status: 400 });
    }

    // Check if user and project exist
    const user = await prisma.user.findUnique({ where: { id: applicantId } });
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!user || !project) {
        return NextResponse.json({ error: 'User or Project not found' }, { status: 404 });
    }

    // Check if the user has already applied for the project
    const existingApplication = await prisma.application.findFirst({
        where: {
            applicantId: applicantId,
            projectId: projectId,
        },
    });
    if (existingApplication) {
        return NextResponse.json({ error: 'User has already applied for this project' }, { status: 409 });
    }

    // Create a new application entry
    await prisma.application.create({
        data: {
            applicantId: applicantId,
            projectId: projectId,
        },
    });

    return NextResponse.json({ message: 'Applied to project successfully!' }, { status: 200 });
}

// Function to withdraw from a project
async function withdrawFromProject(applicantId: string, projectId: string): Promise<NextResponse<ApiResponse>> {
    if (!applicantId || !projectId) {
        return NextResponse.json({ error: 'User ID and Project ID are required' }, { status: 400 });
    }

    // Delete the application entry
    const application = await prisma.application.findFirst({
        where: {
            applicantId: applicantId,
            projectId: projectId,
        },
    });

    if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Delete the found application
    await prisma.application.delete({ where: { id: application.id } });

    return NextResponse.json({ message: 'Withdrawn from project successfully!' }, { status: 200 });
}

// working
export async function PUT(request: NextRequest) {
    const { action, projectId, applicationId } = await request.json();

    console.log('Starting application processing:', {
        action,
        projectId,
        applicationId,
    });
    // Input validation
    if (!['accept', 'reject'].includes(action)) {
        return NextResponse.json(
            {
                error: 'Invalid action. Must be either "accept" or "reject"',
            },
            { status: 400 }
        );
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            console.log('Fetching application with ID:', applicationId);

            const application = await tx.application.findUnique({
                where: { id: applicationId },
                include: { project: true, applicant: true },
            });

            if (!application) {
                console.log('Application not found!');
                throw new Error('Application not found');
            }

            console.log('Current application status:', application.status);

            if (application.status !== 'PENDING') {
                console.log('Application is not pending. Current status:', application.status);
                throw new Error('Application is not in pending state');
            }

            console.log('Updating application status to:', action === 'accept' ? 'ACCEPTED' : 'REJECTED');

            await tx.application.update({
                where: { id: applicationId },
                data: {
                    status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
                },
            });

            console.log('Application status updated successfully!');

            if (action === 'accept') {
                console.log('Adding user to project members...');

                await tx.project.update({
                    where: { id: projectId },
                    data: {
                        applicantCapacity: { decrement: 1 }, // Decrease applicantCapacity for both accept & reject
                        ...(action === 'accept' && { selectionCapacity: { decrement: 1 } }), // Decrease selectionCapacity only for accept
                    },
                });

                await tx.projectMember.create({
                    data: {
                        projectId,
                        userId: application.applicantId,
                    },
                });

                console.log('User added to project members.');
            }

            return { success: true };
        });

        if (result) {
            return NextResponse.json({ error: result });
        }
    } catch (error) {
        console.error('Error processing application:', error);
        return NextResponse.json(
            {
                error: 'Internal server error occurred while processing application',
            },
            { status: 500 }
        );
    }
}
