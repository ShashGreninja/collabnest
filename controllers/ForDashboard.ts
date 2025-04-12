import { NextRequest, NextResponse } from 'next/server';

import { Project } from '@/types/interfaces';

import { prisma } from '@/lib/prisma.ts'; // Use a singleton Prisma instance

export const getUserProjectsById = async ({ params }: { params: { id: string } }) => {
    const { id } = params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                projectsParticipated: {
                    include: {
                        user: true,
                        project: {
                            include: {
                                subtasks: true,
                                author: true,
                                members: {
                                    include: {
                                        user: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Filter user's projects where they are a participant
        const userProjects = user.projectsParticipated.filter((mem) => mem.user.id === id).map((mem) => mem.project);

        return NextResponse.json(userProjects);
    } catch (error) {
        console.error('Error in getUserProjectsById:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
};

export const updateUserProjects = async (req: NextRequest) => {
    try {
        // Extract project ID from params
        // Parse JSON body
        const { id, title, description, requirementTags, deadline } = await req.json();

        // Check if project exists
        const existingProject = await prisma.project.findUnique({ where: { id } });
        if (!existingProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                title: title,

                description: description,

                requirementTags: requirementTags,
                deadlineToComplete: deadline,
            },
        });

        return NextResponse.json(updatedProject, { status: 200 });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
};

export const updateProjectResources = async (req: NextRequest) => {
    try {
        const { resources, projectId } = await req.json();

        if (!projectId || !resources) {
            return NextResponse.json({ message: 'Project ID and resources are required' }, { status: 400 });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                projectResources: resources,
            },
        });

        return NextResponse.json(
            { message: 'Resources updated successfully', project: updatedProject },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating resources:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
};

interface Task {
    id?: string;
    title: string;
    description: string;
    status: string;
    deadline?: string | null;
}

export const updateSubtasks = async (request: NextRequest) => {
    try {
        const { projectId, tasks } = await request.json();
        console.log('Received tasks:', tasks);

        // Get existing tasks for this project
        const existingTasks = await prisma.subtask.findMany({
            where: { projectId },
        });

        // Create a map of existing task IDs for quick lookup
        const existingTaskIds = new Set(existingTasks.map((task: { id: string }) => task.id));

        // Create a set of task IDs from the updated tasks
        const updatedTaskIds = new Set(tasks.map((task: Task) => task.id));

        // Identify tasks to delete (tasks that exist in the database but not in the updated list)
        const tasksToDelete = existingTasks.filter((task: { id: string }) => !updatedTaskIds.has(task.id));

        // Delete tasks that are no longer in the updated list
        for (const task of tasksToDelete) {
            await prisma.subtask.delete({
                where: { id: task.id },
            });
        }

        // Process each task in the updated list
        for (const task of tasks) {
            if (task.id && existingTaskIds.has(task.id)) {
                // Existing task - update it
                await prisma.subtask.update({
                    where: { id: task.id },
                    data: {
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
                    },
                });
            } else {
                // New task - create it
                await prisma.subtask.create({
                    data: {
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
                        projectId,
                    },
                });
            }
        }

        // Fetch the updated project with its subtasks
        const updatedProject = await prisma.project.findUnique({
            where: { id: projectId },
            include: { subtasks: true },
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error('Error updating tasks:', error);
        return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 });
    }
};
