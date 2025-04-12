'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaStar } from 'react-icons/fa';
import { Calendar } from 'lucide-react';
import Loader from '@/components/Loader';
import { useSession } from 'next-auth/react';
import { User } from '@/types/interfaces';

const Discovery = () => {
    type Status = 'OPEN' | 'CLOSED';
    type DifficultyTag = 'INTERMEDIATE' | 'BEGINNER' | 'ADVANCED';
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
        subtasks: string[];
        applications: Application[];
    }

    interface Application {
        id: string;
        projectId: string;
        applicantId: string;
    }

    const [allProjects, setAllProjects] = useState<Project[]>([]); // Stores all fetched projects
    const [projects, setProjects] = useState<Project[]>([]); // Stores filtered projects
    const [loading, setLoading] = useState<boolean>(true); // Loader state
    const [role, setRole] = useState<string | null>(null);
    const [recommendedProjectIds, setRecommendedProjectIds] = useState<string[]>([]);
    const { data: session, status } = useSession();
    console.log(status);
    if (status != 'authenticated') {
        window.location.href = '/welcome';
    }
    const [userId, setId] = useState<string | null>(null);

    const email = session?.user?.email || '';

    const fetchid = async () => {
        try {
            const response = await fetch(`/api/forProfile/byEmail/${session?.user?.email}`);
            const data: User = await response.json();
            setRole(data.role);
            setId(data.id);
            // Return the ID for proper sequencing
        } catch (err) {
            console.error(err);
            return null;
        }
    };
    useEffect(() => {
        fetchid();
        console.log(userId);
    }, [email]);
    const router = useRouter();

    useEffect(() => {
        if (role === null) return; // Wait until role is fetched
        if (role !== 'USER') {
            router.push('/discover');
        }
    }, [role, router]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch recommended project IDs
                if (userId === null) {
                    console.log('User ID is null');
                    return;
                }
                if (role !== 'USER') {
                    console.log('Role is not USER');
                    return;
                }
                console.log(userId);
                const recRes = await fetch(`http://127.0.0.1:8000/recommend/${userId}`);
                const recData = await recRes.json();
                const recommendedIds = recData.data || [];
                console.log(recommendedIds);

                // Fetch all projects
                const projRes = await fetch('/api/projects/All_Project');
                const projData = await projRes.json();
                setAllProjects(projData);

                // Separate top 3 recommended projects
                const topRecommended = projData.filter((project: Project) =>
                    recommendedIds.slice(0, 3).includes(project.id)
                );

                // Append the rest of the projects (excluding the top 3 already included)
                const remainingProjects = projData.filter((project: Project) => !topRecommended.includes(project));

                // Merge both lists with top 3 first
                setProjects([...topRecommended, ...remainingProjects]);
                setAllProjects([...topRecommended, ...remainingProjects]);
                setRecommendedProjectIds([...recommendedIds]);

                // // Fetch all projects
                // const projRes = await fetch("/api/projects/All_Project");
                // const projData = await projRes.json();
                // setAllProjects(projData);
                // setProjects(projData)
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
    const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const applyFilters = () => {
            console.log('Applying filters...');

            const query = searchQuery.trim().toLowerCase();

            const result = allProjects.filter((project) => {
                const deadlineToComplete = new Date(project.deadlineToComplete);
                const deadlineToApply = new Date(project.deadlineToApply);
                const projectDuration = Math.ceil(
                    Math.abs(deadlineToComplete.getTime() - deadlineToApply.getTime()) / (1000 * 60 * 60 * 24 * 30) // Convert to months
                );
                const projectDeadlineDate = deadlineToApply.toISOString().split('T')[0];

                // Apply all filters
                const matchesSearchQuery =
                    query === '' ||
                    (project.title?.toLowerCase() || '').includes(query) ||
                    (project.description?.toLowerCase() || '').includes(query) ||
                    project.requirementTags?.some((tag) => (tag?.toLowerCase() || '').includes(query));

                const matchesDifficulty =
                    selectedDifficulty === 'all' || !selectedDifficulty || project.difficultyTag === selectedDifficulty;

                const matchesDuration =
                    selectedDuration === 'all' || !selectedDuration || projectDuration === Number(selectedDuration);

                const matchesDeadline =
                    selectedDeadline === 'all' || !selectedDeadline || projectDeadlineDate === selectedDeadline;

                const matchesDomain =
                    selectedDomain === 'all' || !selectedDomain || project.requirementTags.includes(selectedDomain);

                return matchesSearchQuery && matchesDifficulty && matchesDuration && matchesDeadline && matchesDomain;
            });

            setProjects(result.length > 0 ? result : []); // Set to empty array if no match
        };

        applyFilters();
    }, [searchQuery, selectedDifficulty, selectedDuration, selectedDeadline, selectedDomain, allProjects]); // Trigger whenever any filter state changes

    // Get unique durations
    const uniqueDurations = Array.from(
        new Set(
            projects.map((project) => {
                const deadlineToComplete = new Date(project.deadlineToComplete);
                const deadlineToApply = new Date(project.deadlineToApply);
                const diffTime = Math.abs(deadlineToComplete.getTime() - deadlineToApply.getTime());
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Convert to months
            })
        )
    );

    // Get unique deadlines for the new dropdown
    const uniqueDeadlines = Array.from(
        new Set(
            projects.map((project) => {
                // Format as YYYY-MM-DD for dropdown value
                const deadline = new Date(project.deadlineToApply);
                return deadline.toISOString().split('T')[0];
            })
        )
    ).sort(); // Sort chronologically

    // Format date for display
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    const resetFilters = () => {
        // Reset the projects to show all projects
        setProjects(allProjects);

        // Reset the filter states to null to show placeholder values
        setSelectedDifficulty(null);
        setSelectedDuration(null);
        setSelectedDeadline(null);
        setSelectedDomain(null);
        setSearchQuery('');
        // Also reset the search query
    };

    // Hardcoded user ID for now
    interface ApplicationResponse {
        message?: string;
        error?: string;
    }

    async function applyForProject(projectId: string, action: string): Promise<void> {
        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantId: userId,
                    projectId: projectId,
                    action,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || data.message || 'Application failed');
            }

            const data: ApplicationResponse = await response.json();
            alert('Project application/withdrawal successful!');

            fetchUpdatedProjects();
        } catch (error) {
            console.error('Error applying for project:', error);
            alert('Failed to apply for project. Please try again later.');
        }
    }

    async function fetchUpdatedProjects() {
        setLoading(true); // Start loading
        try {
            // const res = await fetch("/api/projects/All_Project");
            // const data = await res.json();
            // setAllProjects(data); // Keep all projects updated
            // setProjects(data); // Update the filtered projects
            const projRes = await fetch('/api/projects/All_Project');
            const projData = await projRes.json();

            // Separate top 3 recommended projects
            const topRecommended = projData.filter((project: Project) =>
                recommendedProjectIds.slice(0, 3).includes(project.id)
            );

            // Append the rest of the projects (excluding the top 3 already included)
            const remainingProjects = projData.filter((project: Project) => !topRecommended.includes(project));

            // Merge both lists with top 3 first
            setProjects([...topRecommended, ...remainingProjects]);
            setAllProjects([...topRecommended, ...remainingProjects]);
        } catch (error) {
            console.error('Error fetching updated projects:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    }

    const handleStarClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, projectId: string) => {
        event.stopPropagation();
    };

    if (userId !== null) {
        return (
            <>
                <div className="mx-5">
                    <h1 className="text-3xl mt-5 mb-1 font-bold">Discover Recommended Projects</h1>
                    <p className="text-muted-foreground">
                        Browse projects from professors and research groups across various domains.
                    </p>
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects by clicking Enter"
                        className="w-[100%] md:w-100 my-4"
                    />
                    <div className="flex flex-row flex-wrap justify-start space-x-4 space-y-3">
                        <Select value={selectedDomain || ''} onValueChange={setSelectedDomain}>
                            <SelectTrigger className="">
                                <SelectValue placeholder="Domain" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Domain</SelectLabel>
                                    <SelectItem value="all">All</SelectItem>
                                    {Array.from(
                                        new Set(projects.flatMap((project) => project.requirementTags)) // Flatten and remove duplicates
                                    ).map((domain, index) => (
                                        <SelectItem key={index} value={domain}>
                                            {domain}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select value={selectedDifficulty || ''} onValueChange={setSelectedDifficulty}>
                            <SelectTrigger className="">
                                {/* removed fixed width to make it responsive */}
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Difficulty</SelectLabel>
                                    <SelectItem value="all">All</SelectItem>
                                    {Array.from(new Set(projects.map((project) => project.difficultyTag))) // Remove duplicates
                                        .map((difficulty, index) => (
                                            <SelectItem key={index} value={difficulty}>
                                                {difficulty}
                                            </SelectItem>
                                        ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select value={selectedDuration || ''} onValueChange={setSelectedDuration}>
                            <SelectTrigger className="">
                                <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Duration</SelectLabel>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueDurations.map((duration, index) => (
                                        <SelectItem key={index} value={String(duration)}>
                                            {duration} {duration === 1 ? 'month' : 'months'}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select value={selectedDeadline || ''} onValueChange={setSelectedDeadline}>
                            <SelectTrigger className="sm:w-[180px]">
                                <SelectValue placeholder="Application Deadline" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Application Deadline</SelectLabel>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueDeadlines.map((deadline, index) => (
                                        <SelectItem key={index} value={deadline}>
                                            {new Date(deadline).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <div className="flex flex-row flex-wrap gap-4">
                            <Button onClick={resetFilters}>Reset Filters</Button>
                        </div>
                    </div>
                    <Separator className="my-5" />
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-4 mx-auto">
                            {projects.map((project) => {
                                const isRecommended = recommendedProjectIds.includes(project.id);
                                return (
                                    <Card
                                        key={project.id}
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                        className={`relative p-4 transition-shadow duration-300 cursor-pointer ${
                                            isRecommended ? 'shadow-lg border-2 border-yellow-500' : 'shadow-md'
                                        }`}
                                    >
                                        {isRecommended && (
                                            <div className="absolute top-1 right-1 w-fit  bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-s font-bold px-3 py-1 rounded-full">
                                                Recommended
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-2xl mt-2">{project.title}</CardTitle>
                                            <CardDescription>{project.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className=" bg-black text-center text-sm w-fit px-3 font-semibold rounded-md text-white mb-4">
                                                {project.difficultyTag}
                                            </div>
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
                                                    <span className="font-semibold">Apply by:</span>{' '}
                                                    {formatDate(project.deadlineToApply)}
                                                </p>

                                                <p>
                                                    <span className="font-semibold">Duration:</span>{' '}
                                                    {(() => {
                                                        const deadlineToComplete = new Date(project.deadlineToComplete);
                                                        const deadlineToApply = new Date(project.deadlineToApply);
                                                        const diffTime = Math.abs(
                                                            deadlineToComplete.getTime() - deadlineToApply.getTime()
                                                        );
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        return `${diffDays} days`;
                                                    })()}
                                                </p>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2">
                                            {project.applications
                                                .map((member) => member.applicantId)
                                                .includes(userId) ? (
                                                <Button
                                                    variant="outline"
                                                    className="bg-black text-white"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        applyForProject(project.id, 'withdraw');
                                                    }}
                                                >
                                                    Withdraw
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="bg-black text-white"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        applyForProject(project.id, 'apply');
                                                    }}
                                                >
                                                    Apply
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-auto flex items-center"
                                                onClick={(event) => handleStarClick(event, project.id)}
                                            >
                                                <FaStar className="mr-0.5" /> Star
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="flex items-center justify-center h-40">
            <h1>Loading...</h1>
        </div>
    );
};

export default Discovery;
