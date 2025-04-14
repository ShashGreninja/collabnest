'use client';

import { useState, useEffect } from 'react';
import { ProjectMember, Project, User } from '@/types/interfaces';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export function WelcomeHeader({
    user,
    current,
    projectData,
    onProjectChange,
}: {
    user: User | null;
    current: Project;
    projectData: Project[];
    onProjectChange: (project: Project) => void;
}) {
    // Replace this with the actual user ID

    const { data: session, status } = useSession();

    // Filter projects associated with the user

    // Initialize curr_proj to the first project (if available)

    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {session.user?.name}!</h1>
                    <p className="text-gray-600 mt-2">
                        You're making great progress on your projects. Keep up the good work!
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-zinc-500 shrink-0">
                            {current ? current.title : 'Switch Projects'} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {projectData.map((proj) => (
                            <DropdownMenuItem
                                key={proj.id}
                                onSelect={() => onProjectChange(proj)} // Update the current project on selection
                            >
                                {proj.title}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
