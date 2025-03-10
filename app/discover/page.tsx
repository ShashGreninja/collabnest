"use client";
import { useEffect, useRef, useState } from "react";
import React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { FaStar } from "react-icons/fa";
import { Calendar } from "lucide-react";
import Loader from "@/components/Loader";

const Discovery = () => {
  type Status = "OPEN" | "CLOSED";
  type DifficultyTag = "INTERMEDIATE" | "BEGINNER" | "ADVANCED";
  interface Project {
    id: string;
    authorId: string;
    title: string;
    subheading: string;
    description: string;
    status: Status;
    deadlineToApply: string; // ISO date string
    deadlineToComplete: string; // ISO date string
    difficultyTag: DifficultyTag;
    requirementTags: string[]; // JSON array
    applicantCapacity: number;
    selectionCapacity: number;
    projectResources: any[]; // JSON array
    createdAt: string; // ISO date string
    updatedAt: string;
  }

  const [allProjects, setAllProjects] = useState<Project[]>([]); // Stores all fetched projects
  const [projects, setProjects] = useState<Project[]>([]); // Stores filtered projects

  const [loading, setLoading] = useState<boolean>(true); // Loader state

  useEffect(() => {
    setLoading(true); // Start loading

    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setAllProjects(data); // Keep all projects
        setProjects(data); // Show all projects initially
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false)); // Stop loading
  }, []);

  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique durations
  const uniqueDurations = Array.from(
    new Set(
      allProjects.map((project) => {
        const deadlineToComplete = new Date(project.deadlineToComplete);
        const deadlineToApply = new Date(project.deadlineToApply);
        const diffTime = Math.abs(
          deadlineToComplete.getTime() - deadlineToApply.getTime()
        );
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Convert to months
      })
    )
  );

  // Get unique deadlines for the new dropdown
  const uniqueDeadlines = Array.from(
    new Set(
      allProjects.map((project) => {
        // Format as YYYY-MM-DD for dropdown value
        const deadline = new Date(project.deadlineToApply);
        return deadline.toISOString().split("T")[0];
      })
    )
  ).sort(); // Sort chronologically

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString("en-US", options);
  };

  const Searchonclick = () => {
    const result = allProjects.filter((project) => {
      // Always filter from allProjects
      const deadlineToComplete = new Date(project.deadlineToComplete);
      const deadlineToApply = new Date(project.deadlineToApply);
      const projectDuration = Math.ceil(
        Math.abs(deadlineToComplete.getTime() - deadlineToApply.getTime()) /
          (1000 * 60 * 60 * 24 * 30) // Convert to months
      );
      const projectDeadlineDate = deadlineToApply.toISOString().split("T")[0];

      return (
        (selectedDuration === "all" ||
          !selectedDuration ||
          projectDuration === Number(selectedDuration)) &&
        (selectedDomain === "all" ||
          !selectedDomain ||
          project.requirementTags.includes(selectedDomain)) &&
        (selectedDifficulty === "all" ||
          !selectedDifficulty ||
          project.difficultyTag === selectedDifficulty) &&
        (selectedDeadline === "all" ||
          !selectedDeadline ||
          projectDeadlineDate === selectedDeadline)
      );
    });

    setProjects(result); // Update displayed projects without losing original data
  };
  const resetFilters = () => {
    // Reset the projects to show all projects
    setProjects(allProjects);

    // Reset the filter states to null to show placeholder values
    setSelectedDifficulty(null);
    setSelectedDuration(null);
    setSelectedDeadline(null);
    setSelectedDomain(null);
    setSearchQuery("");
    // Also reset the search query
  };
  const filterProjectsBySearch = () => {
    if (searchQuery.trim() === "") {
      setProjects(allProjects); // Reset to all projects if search query is empty
    } else {
      const result = allProjects.filter((project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setProjects(result.length > 0 ? result : []); // Set to empty array if no match
    }
  };

  return (
    <>
      <div className="mx-5">
        <h1 className="text-3xl mt-5 mb-1 font-bold">
          Discover Recommended Projects
        </h1>
        <p className="text-muted-foreground">
          Browse projects from professors and research groups across various
          domains.
        </p>
        <Input //currently work independtly from filters if search then filter not active
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              filterProjectsBySearch();
              setSelectedDifficulty(null);
              setSelectedDuration(null);
              setSelectedDeadline(null);
              setSelectedDomain(null);
            }
          }}
          placeholder="Search projects by clicking Enter"
          className="w-[100%] md:w-100 my-4"
        />
        <div className="flex flex-row flex-wrap justify-start space-x-4 space-y-3">
          <Select
            value={selectedDomain || ""}
            onValueChange={setSelectedDomain}
          >
            <SelectTrigger className="">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Domain</SelectLabel>
                <SelectItem value="all">All</SelectItem>
                {Array.from(
                  new Set(
                    allProjects.flatMap((project) => project.requirementTags)
                  ) // Flatten and remove duplicates
                ).map((domain, index) => (
                  <SelectItem key={index} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={selectedDifficulty || ""}
            onValueChange={setSelectedDifficulty}
          >
            <SelectTrigger className=""> 
              {/* removed fixed width to make it responsive */}
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Difficulty</SelectLabel>
                <SelectItem value="all">All</SelectItem>
                {Array.from(
                  new Set(allProjects.map((project) => project.difficultyTag))
                ) // Remove duplicates
                  .map((difficulty, index) => (
                    <SelectItem key={index} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={selectedDuration || ""}
            onValueChange={setSelectedDuration}
          >
            <SelectTrigger className="">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Duration</SelectLabel>
                <SelectItem value="all">All</SelectItem>
                {uniqueDurations.map((duration, index) => (
                  <SelectItem key={index} value={String(duration)}>
                    {duration} {duration === 1 ? "month" : "months"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={selectedDeadline || ""}
            onValueChange={setSelectedDeadline}
          >
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Application Deadline" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Application Deadline</SelectLabel>
                <SelectItem value="all">All</SelectItem>
                {uniqueDeadlines.map((deadline, index) => (
                  <SelectItem key={index} value={deadline}>
                    {new Date(deadline).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex flex-row flex-wrap gap-4">
            <Button onClick={Searchonclick}>Search</Button>
            <Button onClick={resetFilters}>Reset Filters</Button>
          </div>
        </div>
        <Separator className="my-5" />
        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-4 mx-auto">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap mb-4">
                    {project.requirementTags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-black text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded mb-2"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-gray-600 text-sm space-y-2">
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Apply by:</span>{" "}
                      {formatDate(project.deadlineToApply)}
                    </p>

                    <p>
                      <span className="font-semibold">Duration:</span>{" "}
                      {(() => {
                        const deadlineToComplete = new Date(
                          project.deadlineToComplete
                        );
                        const deadlineToApply = new Date(
                          project.deadlineToApply
                        );
                        const diffTime = Math.abs(
                          deadlineToComplete.getTime() -
                            deadlineToApply.getTime()
                        );
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24)
                        );
                        return `${diffDays} days`;
                      })()}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="w-auto bg-black text-white"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    className="w-auto flex items-center"
                  >
                    <FaStar className="mr-0.5" /> Star
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}{" "}
      </div>
    </>
  );
};

export default Discovery;
