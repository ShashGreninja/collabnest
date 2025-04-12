'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '@/types/interfaces.ts';

interface ProjectContextType {
    currentProject: Project | null;
    setCurrentProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    return <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
