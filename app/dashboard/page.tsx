'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProjectOverview } from '@/components/dashboard/ProjectOverview';
import { ProjectTimeline } from '@/components/dashboard/ProjectTimeline';
import { ProjectMessages } from '@/components/dashboard/ProjectMessages';
import { ProjectResources } from '@/components/dashboard/ProjectResources';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';

import EditProjectManagementModal from '@/components/modals/EditProjectManagementModal';
import EditTeamModal from '@/components/modals/EditTeamModal';
import EditTaskTimelineModal from '@/components/modals/EditTaskTimelineModal';
import EditLearningMaterialsModal from '@/components/modals/EditLearningMaterialsModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import EndProjectModal from '@/components/modals/EndProjectModal';
import EndButton from '@/components/ui/end-button';
import { Project, Subtask, User, Role } from '@/types/leaderboard.ts';
import Loader from '@/components/Loader';
import { useSession } from 'next-auth/react';
import { useProject } from '../context/projectContext';

export default function Dashboard() {
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [isTeamModalOpen, setTeamModalOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isResourcesModalOpen, setResourcesModalOpen] = useState(false);
    const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);

    const [isEndProjectModalOpen, setEndProjectModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    //const id = "addd061b-6883-4bab-a355-4479bf659623"; // User ID (should come from auth system)

    // const id = "addd061b-6883-4bab-a355-4479bf659623";

    const { currentProject, setCurrentProject } = useProject(); // ✅ Use context instead of useState

    const [UserProjects, setUserProjects] = useState<Project[]>([]);
    // const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [curr_user, setUser] = useState<User | null>(null);
    const [projectStatus, setProjectStatus] = useState<string | null>(null); // New state for project status
    const project_id = useRef('');
    const isAuth = curr_user?.role !== 'USER'; // Authentication status (should come from auth system)

    const [id, setId] = useState('addd061b-6883-4bab-a355-4479bf659623'); // User ID (should come from auth system)

    const { data: session, status } = useSession();
    console.log(status);
    if (status != 'authenticated') {
        window.location.href = '/welcome';
    }

    const handleCurrentProject = (project: Project) => {
        setCurrentProject(project);
    };

    const fetchProjects = async () => {
        try {
            const endpoint = isAuth ? `/api/forDashboard/byAuthor/${id}` : `/api/forDashboard/byUserId/${id}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data: Project[] = await response.json();
            setUserProjects(data);

            if (data.length > 0) {
                if (currentProject) {
                    const updatedCurrentProject = data.find((p) => p.id === currentProject.id);
                    if (updatedCurrentProject) {
                        setCurrentProject(updatedCurrentProject);
                    } else {
                        setCurrentProject(data[0]);
                    }
                } else {
                    setCurrentProject(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchUser = () => {
        fetch(`/api/forDashboard/userDetails/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((res) => res.json())
            .then((data: User) => {
                setUser(data);
            })
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        fetchProjects();
        fetchUser();
    }, [id, isAuth]); // Added isAuth as a dependency

    useEffect(() => {
        if (currentProject?.id) {
            project_id.current = currentProject.id;
            setProjectStatus(currentProject.status); // Update project status state
        }
    }, [currentProject]);

    const onSaveProject = async ({
        project_id,
        title,
        description,
        tags,
        deadline,
    }: {
        project_id: string;
        title: string;
        description: string;
        tags: string[];
        deadline: string;
    }) => {
        try {
            const response = await fetch(`/api/forDashboard/updateProject/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: project_id,
                    title,
                    description,
                    requirementTags: tags,
                    deadlineToComplete: deadline,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update project: ${response.statusText}`);
            }

            if (currentProject && currentProject.id === project_id) {
                const updatedProject = {
                    ...currentProject,
                    title,
                    description,
                    requirementTags: tags,
                    deadlineToComplete: deadline,
                };

                setCurrentProject(updatedProject);
                setUserProjects((prevProjects) =>
                    prevProjects.map((project) => (project.id === project_id ? updatedProject : project))
                );
            }

            setProjectModalOpen(false);
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    const onCreateProject = () => {
        fetchProjects();
    };

    const onSaveTask = (updatedTasks: Subtask[]) => {
        if (currentProject) {
            const updatedProject = {
                ...currentProject,
                subtasks: updatedTasks,
            };

            setCurrentProject(updatedProject);
            setUserProjects((prevProjects) =>
                prevProjects.map((project) => (project.id === currentProject.id ? updatedProject : project))
            );
        }
    };

    const onSaveResources = () => {
        fetchProjects();
    };

    const onEndProject = async (ratings: { [userId: string]: number }) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/forDashboard/endProject/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: currentProject?.id,
                    ratings,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to end project: ${response.statusText}`);
            }

            // Update project status immediately
            setCurrentProject((prev) => (prev ? { ...prev, status: 'CLOSED' } : prev));
            setProjectStatus('CLOSED'); // Update UI immediately

            setEndProjectModalOpen(false);
        } catch (error) {
            console.error('Error ending project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onIssueCertificate = () => {
        // Implement the logic to issue certificates
        console.log('Issuing certificates for project:', currentProject?.id);
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-8">
            <WelcomeHeader
                user={curr_user}
                projectData={UserProjects}
                current={currentProject}
                onProjectChange={handleCurrentProject}
            />

            {/* Create Project Button - Only visible for authenticated authors */}
            {isAuth && (
                <div className="flex justify-end mb-6">
                    {UserProjects.length !== 0 && (
                        <Button
                            onClick={() => setCreateProjectModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Create New Project
                        </Button>
                    )}
                </div>
            )}

            {/* Modals */}
            <>
                <CreateProjectModal
                    isOpen={isCreateProjectModalOpen}
                    onClose={() => setCreateProjectModalOpen(false)}
                    onCreate={onCreateProject}
                    currentUser={{
                        id: id,
                        name: curr_user?.name || 'Author',
                    }}
                />
                <EditProjectManagementModal
                    isOpen={isProjectModalOpen}
                    onClose={() => setProjectModalOpen(false)}
                    projectData={currentProject}
                    onSave={onSaveProject}
                />
                <EditTeamModal
                    isOpen={isTeamModalOpen}
                    onClose={() => setTeamModalOpen(false)}
                    projectData={currentProject}
                    isAuthor={isAuth}
                />
                <EditTaskTimelineModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setTaskModalOpen(false)}
                    tasks={currentProject?.subtasks || []}
                    projectId={currentProject?.id || ''}
                    onSave={onSaveTask}
                />
                <EditLearningMaterialsModal
                    id={project_id.current}
                    isOpen={isResourcesModalOpen}
                    onClose={() => setResourcesModalOpen(false)}
                    materials={currentProject?.projectResources || []}
                    onSave={onSaveResources}
                    isAuthor={isAuth}
                />
                <EndProjectModal
                    isOpen={isEndProjectModalOpen}
                    onClose={() => setEndProjectModalOpen(false)}
                    onEndProject={onEndProject}
                    contributors={
                        currentProject?.members.map((member) => ({
                            id: member.user.id,
                            name: member.user.name,
                        })) || []
                    }
                />
            </>

            {/* Main Content */}
            {currentProject ? (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <ProjectOverview current={currentProject} />
                        <div className="flex items-center gap-4 mt-0 mb-4">
                            {isAuth ? (
                                <>
                                    <Button onClick={() => setProjectModalOpen(true)} className="bg-black text-white">
                                        Edit Project Details
                                    </Button>
                                    <Button onClick={() => setTeamModalOpen(true)} className="bg-black text-white">
                                        Edit Team
                                    </Button>
                                </>
                            ) : null}
                        </div>

                        <ProjectTimeline tasks={currentProject.subtasks} />
                        {isAuth ? (
                            <>
                                {projectStatus !== 'CLOSED' && (
                                    <>
                                        <Button
                                            onClick={() => setTaskModalOpen(true)}
                                            className="mt-2 bg-black text-white"
                                        >
                                            Edit Task Timeline
                                        </Button>
                                        <EndButton
                                            onClick={() => setEndProjectModalOpen(true)}
                                            className="mt-2 bg-red-600 text-white"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Ending Project...' : 'End Project'}
                                        </EndButton>
                                    </>
                                )}
                                {projectStatus === 'CLOSED' && (
                                    <>
                                        <Button className="mt-2 bg-gray-500 text-white" disabled>
                                            Closed
                                        </Button>
                                        <Button
                                            onClick={onIssueCertificate}
                                            className="mt-2 ml-2 bg-blue-500 text-white"
                                        >
                                            Issue Certificate
                                        </Button>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>
                    <div>
                        <ProjectMessages />
                        <ProjectResources resources={currentProject.projectResources} />
                        {isAuth ? (
                            <Button onClick={() => setResourcesModalOpen(true)} className="mt-2 bg-black text-white">
                                Edit Learning Materials
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12">
                    {UserProjects.length === 0 ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">No Projects Found</h2>
                            <p className="text-gray-600 mb-6">
                                {isAuth
                                    ? "You haven't created any projects yet. Create your first project to get started."
                                    : "You haven't been assigned to any projects yet. Please check back later."}
                            </p>
                            {isAuth && (
                                <Button
                                    onClick={() => setCreateProjectModalOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Create Your First Project
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Loader />
                    )}
                </div>
            )}
        </div>
    );
}
