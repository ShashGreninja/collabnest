import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Project, ProjectMember, Subtask, User } from '@/types/interfaces.ts';
import ContactProfessorModal from '../modals/ContactProfessorModal.tsx';
import Link from 'next/link';
import '../../app/globals.css'; // Import global CSS
import ProjectDetailsModal from '../modals/ProjectDetailsModal.tsx';

export function ProjectOverview({ current }: { current: Project }) {
    const [contact, setContact] = useState(false);
    const [details, setDetails] = useState(false);
    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                <div>
                    <CardTitle className="text-xl font-bold">{current.title}</CardTitle>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                        {current.requirementTags.length > 3
                            ? current.requirementTags.slice(0, 3).map((tags, index) => (
                                  <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-gray-800 text-white hover:bg-gray-700"
                                  >
                                      {tags}
                                  </Badge>
                              ))
                            : current.requirementTags.map((tags, index) => (
                                  <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-gray-800 text-white hover:bg-gray-700"
                                  >
                                      {tags}
                                  </Badge>
                              ))}

                        <span className="text-sm text-gray-600">By {current.author.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-2">
                        {/* <Link href={`/dashboard/${current.id}`}>
              <Button size='sm'>View Details</Button>
            </Link> */}
                        <Button size="sm" onClick={() => setDetails(true)}>
                            Project Details
                        </Button>
                        {details && (
                            <ProjectDetailsModal isOpen={details} onClose={() => setDetails(false)} proj={current} />
                        )}
                        <Button size="sm" onClick={() => setContact(true)}>
                            Contact Prof.
                        </Button>
                        {contact && (
                            <ContactProfessorModal
                                isOpen={contact}
                                onClose={() => setContact(false)}
                                professorData={current.author}
                                projectId={current.id}
                                projectName={current.title}
                            />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <TeamMembers members={current.members} />
                    <CurrentTask tasks={current.subtasks} />
                    <Deadline deadline={current.deadlineToComplete} />
                    <ProjectID id={current.id} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ProjectDescription desc={current.description} />
                    <ProfessorContact con={current.author.email} />
                </div>
            </CardContent>
        </Card>
    );
}

function TeamMembers({ members }: { members: ProjectMember[] }) {
    const firstThree = members.slice(0, 3);
    const remainingCount = members.length > 3 ? members.length - 3 : 0;

    return (
        <div>
            <h3 className="font-medium mb-2">Team Members</h3>
            <div className="flex -space-x-2">
                {firstThree.map((member, index) => (
                    <Avatar key={index} className="h-8 w-8 border-2 border-white">
                        <AvatarFallback className="bg-blue-600 text-white">{member.user.name[0]}</AvatarFallback>
                    </Avatar>
                ))}
                {remainingCount > 0 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs border-2 border-white">
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}

function CurrentTask({ tasks }: { tasks: Subtask[] }) {
    const sortProjects = (projects: Subtask[]) => {
        const statusOrder: Record<string, number> = {
            closed: 1,
            in_progress: 2,
            open: 3,
        };
        return projects.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    };
    tasks = sortProjects(tasks);
    return (
        <div>
            <h3 className="font-medium mb-2">Current Task</h3>
            <Badge className="bg-gray-800 text-white hover:bg-gray-700">
                Current:
                {tasks.find((item) => item.status === 'IN PROGRESS')?.title || 'No Tasks'}
            </Badge>

            <p className="text-sm text-gray-600 mt-2">
                Next:
                {tasks.find((item) => item.status === 'OPEN')?.title || 'No Tasks'}
            </p>
        </div>
    );
}

function Deadline({ deadline }: { deadline: string }) {
    return (
        <div>
            <h3 className="font-medium mb-2">Deadline</h3>
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{deadline.slice(0, 10)}</span>
            </div>
        </div>
    );
}

function ProjectID({ id }: { id: string }) {
    return (
        <div>
            <h3 className="font-medium mb-2">Project ID</h3>
            <p>{id}</p>
        </div>
    );
}

function ProjectDescription({ desc }: { desc: string }) {
    return (
        <div>
            <h3 className="font-medium mb-2">Project Description</h3>
            <p className="text-sm text-gray-600">{desc}</p>
        </div>
    );
}

function ProfessorContact({ con }: { con: string }) {
    return (
        <div>
            <h3 className="font-medium mb-2">Professor Contact</h3>
            <p className="text-sm text-gray-600">{con}</p>
        </div>
    );
}
