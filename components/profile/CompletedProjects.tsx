"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description?: string;
  requirementTags: string[]; // Domains
  deadlineToComplete?: string;
}

export const CompletedProjects = ({ id }: { id: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchCompletedProjects = async () => {
      try {
        const response = await fetch(`/api/projects/completed/${id}`);
        if (!response.ok) throw new Error("Failed to fetch projects");

        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError("Error fetching completed projects");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedProjects();
  }, []);

  if (loading)
    return (
      <Card className='mb-6' aria-busy='true' aria-label='Loading completed projects'>
        <CardHeader><CardTitle>Completed Projects</CardTitle></CardHeader>
        <CardContent className='space-y-5'>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className='flex justify-between gap-4 py-3 animate-pulse'>
              <div className='flex-1 space-y-3'>
                <div className='h-5 w-2/3 rounded bg-muted' />
                <div className='h-4 w-full rounded bg-muted' />
                <div className='h-4 w-1/3 rounded bg-muted' />
              </div>
              <div className='h-8 w-20 rounded bg-muted' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  if (error) return <p className='text-red-500'>{error}</p>;

  const displayedProjects = showAll ? projects : projects.slice(0, 2);

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle>Completed Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className='text-muted-foreground'>No completed projects found.</p>
        ) : (
          <>
            {displayedProjects.map((project) => (
              <div
                key={project.id}
                className='flex justify-between items-center py-4 border-b last:border-b-0 gap-3'>
                <div>
                  <div className='font-medium'>{project.title}</div>
                  <div className='text-sm text-muted-foreground'>
                    {project.description || "No description available"}
                  </div>
                  <div className='mt-2 flex space-x-2'>
                    {project.requirementTags.map((domain) => (
                      <Badge
                        key={`item-${Date.now()}-${Math.random()}`}
                        variant='outline'>
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className='flex flex-col items-center lg:space-x-2 lg:flex-row gap-y-2'>
                  <span className='text-sm text-center text-muted-foreground'>
                    {project.deadlineToComplete
                      ? new Date(
                          project.deadlineToComplete
                        ).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <Button variant='outline' size='icon'>
                    <Eye className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
            {projects.length > 2 && (
              <Button variant='link' onClick={() => setShowAll(!showAll)}>
                {showAll ? "View Less" : "View More"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
