"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { User } from "@/types/leaderboard";

export default function ProjectDetails() {
  const { id } = useParams(); // Get project ID from URL
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

 // console.log(useParams() , "params");
  const projectId = id as string; // Ensure projectId is a string
 // console.log(projectId , "id from params");
  const { data: session, status } = useSession();
  console.log(status);
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/welcome";
    }
  }, [status]);
  
  const [userId, setId] = useState<string | null>(null);

  const email = session?.user?.email || "";

  const fetchid = async () => {
    if (!email) return;
    try {
      const response = await fetch(
        `/api/forProfile/byEmail/${email}`
      );
      const data: User = await response.json();
      setRole(data.role);
      setId(data.id);
    } catch (err) {
      console.error(err);
      return null;
    }
  };
  useEffect(() => {
    if (email) {
      fetchid();
    }
  }, [email]);
  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");

      const data = await res.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  interface ApplicationResponse {
    message?: string;
    error?: string;
  }

  async function applyForProject(
    projectId: string,
    action: string
  ): Promise<void> {
    try {
      setButtonLoading(true);
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: userId,
          projectId: projectId,
          action,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Application failed");
      }

      await fetchProject();
      const data: ApplicationResponse = await response.json();
      alert("Project application/withdrawal successful!");
      setButtonLoading(false);
    } catch (error) {
      console.error("Error applying for project:", error);
      alert("Failed to apply for project. Please try again later.");
    }
  }

  const enrollment = project?.applications
    .map((member : any) => member.applicantId)
    .includes(userId);

  // BUG FIX 2.1: Derive deadline state
  const deadlinePassed = project?.deadlineToApply
    ? new Date() > new Date(project.deadlineToApply)
    : false;

  // BUG FIX 2.2: Derive capacity state
  const capacityFull =
    project && project.applications.filter((application: any) => application.status !== "REJECTED").length >= project.applicantCapacity;

  const action = enrollment ? "withdraw" : "apply";

  // Disable enroll button if not already enrolled and deadline passed or capacity full
  const enrollDisabled = buttonLoading || (!enrollment && (deadlinePassed || capacityFull));

  const enrollLabel = buttonLoading
    ? "Loading..."
    : enrollment
    ? "UnEnroll"
    : deadlinePassed
    ? "Deadline Passed"
    : capacityFull
    ? "Applications Full"
    : "Enroll in Project";

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-white shadow-xl rounded-2xl space-y-8">
      {/* Project Title */}
      <h1 className="text-4xl font-bold text-gray-800 text-center">{project.title}</h1>
    
      {/* Project Details & Subtasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 p-6 border border-gray-200 rounded-2xl bg-gray-50 space-y-3">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Project Details</h2>
          <p><span className="font-bold text-gray-600">Domain:</span> {project.requirementTags.join(", ")}</p>
          <p><span className="font-bold text-gray-600">Mentor:</span> {project.author?.name || "TBA"}</p>
          <p><span className="font-bold text-gray-600">Difficulty:</span> {project.difficultyTag}</p>
          <p><span className="font-bold text-gray-600">Slots:</span> {project.selectionCapacity}/{project.applicantCapacity}</p>
          <p className="text-gray-600 pt-2">{project.description}</p>
        </div>
    
        {/* Subtasks */}
        <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Subtasks</h2>
          <ul className="space-y-3">
            {project.subtasks.map((subtask: any, index: number) => (
              <li key={index} className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  readOnly
                  className="mr-2 accent-black"
                />
                {subtask.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    
      {/* Project Resources */}
      <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">Project Resources</h2>
        <ul className="list-disc list-inside text-blue-600">
          {project.projectResources.map((res: any, index: number) => (
            <li key={index}>
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-800"
              >
                {res.name} ({res.type})
              </a>
            </li>
          ))}
        </ul>
      </div>
     
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {role === "USER" ? (
    <>
      {/* Enroll Button */}
      <div className="p-6 border border-gray-200 flex flex-col items-center rounded-2xl bg-gray-50 space-y-2">
        <h2 className="text-2xl text-center font-semibold text-gray-700">Enroll in Project</h2>
        <p className="text-gray-600 text-center">
          {project.selectionCapacity}/{project.applicantCapacity} slots filled
        </p>
        <p className="text-gray-600 text-center">
          {enrollment
            ? "You are currently enrolled in this project."
            : "Click the button below to enroll in this project."}
        </p>
        <button
          onClick={() => applyForProject(projectId, action)}
          disabled={enrollDisabled}
          className={`w-full tracking-wider active:scale-95 text-white py-2 rounded-xl transition-all duration-200 ease-in-out shadow-md hover:shadow-lg ${
            enrollDisabled && !enrollment
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {enrollLabel}
        </button>
      </div>

      {/* Schedule Meeting */}
      <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50 space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Schedule Meeting</h2>
        <input
          type="date"
          className="w-full p-2 border border-gray-300 rounded-xl"
        />
        <button className="w-full bg-black hover:bg-gray-800 tracking-wider active:scale-95 text-white py-2 rounded-xl transition-all duration-200 ease-in-out shadow-md hover:shadow-lg">
          Schedule
        </button>
      </div>
    </>
  ) : (
    // For non-users: Centered Schedule Meeting
    <div className="md:col-span-2 flex justify-center">
      <div className="p-6 w-full max-w-md border border-gray-200 rounded-2xl bg-gray-50 space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Schedule Meeting</h2>
        <input
          type="date"
          className="w-full p-2 border border-gray-300 rounded-xl"
        />
        <button className="w-full bg-black hover:bg-gray-800 tracking-wider active:scale-95 text-white py-2 rounded-xl transition-all duration-200 ease-in-out shadow-md hover:shadow-lg">
          Schedule
        </button>
      </div>
    </div>
  )}
</div>

    </div>  
  );
}
