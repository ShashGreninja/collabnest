"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, XCircle } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description?: string;
  requirementTags: string[]; // Domains
  deadlineToApply?: string;
  status: string;
}

export const RecentActivity = ({ id }: { id: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchAppliedProjects = async () => {
      try {
        const response = await fetch(`/api/projects/applied/${id}`);
        if (!response.ok) throw new Error("Failed to fetch applied projects");

        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError("Error fetching applied projects");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedProjects();
  }, []);

  if (loading)
    return (
      <Card className='mb-6' aria-busy='true' aria-label='Loading applied projects'>
        <CardHeader><CardTitle>Applied Projects</CardTitle></CardHeader>
        <CardContent className='space-y-5'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='flex justify-between gap-4 py-3 animate-pulse'>
              <div className='flex-1 space-y-3'>
                <div className='h-5 w-2/3 rounded bg-muted' />
                <div className='h-4 w-full rounded bg-muted' />
                <div className='h-4 w-1/3 rounded bg-muted' />
              </div>
              <div className='h-8 w-24 rounded bg-muted' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  if (error) return <p className='text-red-500'>{error}</p>;

  const displayedProjects = showAll ? projects : projects.slice(0, 3);

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle>Applied Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className='text-muted-foreground'>
            You haven't applied to any projects yet.
          </p>
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
                    {project.requirementTags.map((tag) => (
                      <Badge
                        key={`item-${Date.now()}-${Math.random()}`}
                        variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className='flex flex-col items-center lg:space-x-2 lg:flex-row gap-y-2'>
                  <span className='text-sm text-center text-muted-foreground'>
                    {project.deadlineToApply
                      ? `Apply by ${new Date(
                          project.deadlineToApply
                        ).toLocaleDateString()}`
                      : "No deadline"}
                  </span>
                  {project.status === "OPEN" ? (
                    <Button variant='outline' size='icon'>
                      <Clock className='h-4 w-4 text-yellow-500' />
                    </Button>
                  ) : (
                    <Button variant='outline' size='icon'>
                      <XCircle className='h-4 w-4 text-red-500' />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {projects.length > 3 && (
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
