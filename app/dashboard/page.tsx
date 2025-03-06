"use client";
import "../globals.css";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { CalendarIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const projectsData = [
  {
    id: "proj1",
    title: "Autonomous Robot Navigation using Deep RL",
    category: "Web Development",
    description:
      "Developing autonomous navigation capabilities for robots using Deep Reinforcement Learning techniques.",
    professor: {
      name: "Prof. Sriparna Saha",
      contact: "+91 9372180121 | nrisht@gmail.com",
    },
    teamMembers: [
      { id: "1", name: "Chaitanya Narayan", avatar: "/profile-2.png" },
      { id: "2", name: "Emily Wong", avatar: "/profile-2.png" },
    ],
    deadline: "March 15, 2025",
    tasks: [
      {
        id: "task1",
        title: "Research and Planning",
        description: "Research existing robot navigation algorithms",
        status: "Completed",
        dueDate: "Mar 15, 2025",
      },
      {
        id: "task2",
        title: "Algorithm Implementation",
        description:
          "Implement core navigation algorithm using Deep RL techniques",
        status: "In Progress",
        dueDate: "Mar 25, 2025",
      },
      {
        id: "task3",
        title: "API Scheduling",
        description: "Develop API endpoints for robot control and scheduling",
        status: "Upcoming",
        dueDate: "Apr 15, 2025",
      },
    ],
    messages: [
      {
        id: "msg1",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
      {
        id: "msg2",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
      {
        id: "msg3",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
      {
        id: "msg4",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
      {
        id: "msg5",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
      {
        id: "msg6",
        sender: {
          name: "Jackson Lee",
          role: "Team Member",
          avatar: "/profile-2.png",
        },
        text: "Almost! Just running final checks on the implementation.",
        timestamp: "1h ago",
      },
      {
        id: "msg7",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
      {
        id: "msg8",
        sender: {
          name: "Olivia",
          role: "Mentor",
          avatar: "/profile-2.png",
        },
        text: "Hey, did you complete the algorithm implementation?",
        timestamp: "1h ago",
      },
    ],
    resources: [
      {
        id: "res1",
        title: "Deep RL for Navigation Document",
        type: "Document",
        url: "/resources/deep-rl-navigation.pdf",
      },
      {
        id: "res2",
        title: "Robot Navigation Tutorial",
        type: "Link",
        url: "https://example.com/robot-navigation-tutorial",
      },
      {
        id: "res3",
        title: "Robot Navigation Tutorial",
        type: "Link",
        url: "https://example.com/robot-navigation-tutorial",
      },
      {
        id: "res4",
        title: "Robot Navigation Tutorial",
        type: "Link",
        url: "https://example.com/robot-navigation-tutorial",
      },
      {
        id: "res5",
        title: "Robot Navigation Tutorial",
        type: "Link",
        url: "https://example.com/robot-navigation-tutorial",
      },
      {
        id: "res6",
        title: "Robot Navigation Tutorial",
        type: "Link",
        url: "https://example.com/robot-navigation-tutorial",
      },
      {
        id: "res7",
        title: "Robot Navigation Tutorial",
        type: "Link",
        url: "https://example.com/robot-navigation-tutorial",
      },
    ],
  },
  // Add more project objects here for multiple projects
  {
    id: "proj2",
    title: "AI-Powered Smart City Traffic Management",
    category: "Machine Learning",
    description:
      "Developing an AI system to optimize traffic flow in urban environments.",
    professor: {
      name: "Dr. Emily Chen",
      contact: "+1 650-123-4567 | echen@university.edu",
    },
    teamMembers: [
      {
        id: "3",
        name: "William Kim",
        avatar: "/profile-2.png",
      },
    ],
    deadline: "April 30, 2025",
    tasks: [
      {
        id: "task4",
        title: "Initial Research",
        description: "Literature review and initial system design",
        status: "Completed",
        dueDate: "Feb 15, 2025",
      },
      {
        id: "task5",
        title: "Data Collection",
        description: "Gather traffic data from multiple city intersections",
        status: "In Progress",
        dueDate: "Mar 30, 2025",
      },
    ],
    messages: [
      {
        id: "msg3",
        sender: {
          name: "William Kim",
          role: "Research Assistant",
          avatar: "/profile-2.png",
        },
        text: "Data collection pipeline is ready for review!",
        timestamp: "2h ago",
      },
    ],
    resources: [
      {
        id: "res3",
        title: "Traffic Dataset",
        type: "Document",
        url: "/resources/traffic-dataset.csv",
      },
    ],
  },
];

const ProjectOverview = () => {
  const [currProjectIndex, setCurrProjectIndex] = useState(0);
  const currentProject = projectsData[currProjectIndex];

  return (
    <div>
      <div className='flex justify-between items-center p-5 ml-2 mr-6'>
        <div className='ml-5'>
          <h1 className='text-3xl font-bold'>Welcome back, Chaitanya!</h1>
          <p className='text-gray-600'>
            You're making great progress on your projects!
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              className='text-zinc-500 text-sm font-medium font-inter'>
              Switch Projects <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {projectsData.map((project, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => setCurrProjectIndex(index)}>
                {project.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='grid grid-cols-12 gap-6 p-6 ml-4 mr-4'>
        {/* Project Details - 8 columns */}
        <Card className='h-[350px] col-span-8 p-4 border rounded-xl shadow-sm shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] border-zinc-200'>
          <div className='flex'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xl font-semibold'>
                {currentProject.title}
              </CardTitle>
              <p className='text-sm text-gray-600'>
                By {currentProject.professor.name}
              </p>
              <Badge className='bg-black text-white'>
                {currentProject.category}
              </Badge>
            </CardHeader>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='h-10 px-4 py-2 bg-zinc-100 rounded-md flex-col justify-center items-center gap-2.5 inline-flex'>
                  Project Details
                </Button>
                <Button
                  variant='default'
                  className='h-10 px-4 py-2 bg-zinc-900 rounded-md flex-col justify-center items-center gap-2.5 inline-flex'>
                  Contact Prof.
                </Button>
              </div>
            </div>
          </div>
          <CardContent>
            <div className='flex gap-16 text-sm font-bold text-zinc-950'>
              <div>
                <p>Team Members</p>
                <div className='flex items-center'>
                  {currentProject.teamMembers
                    .slice(0, 3)
                    .map((member, index) => (
                      <div
                        key={member.id}
                        className={`relative ${index !== 0 ? "-ml-4" : "ml-0"}`}
                        style={{ zIndex: 10 + index }}>
                        <Avatar className='w-10 h-10'>
                          <AvatarImage src={member.avatar} alt={member.name} />
                        </Avatar>
                      </div>
                    ))}
                  {currentProject.teamMembers.length > 3 && (
                    <span className='ml-2 text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full'>
                      +{currentProject.teamMembers.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className='pl-1'>Current Task</p>
                <Badge className='h-[22px] px-2.5 py-0.5 bg-black text-white rounded-full'>
                  {currentProject.tasks.find(
                    (task) => task.status === "In Progress"
                  )?.title || "No active tasks"}
                </Badge>
                <p className='text-xs font-medium mt-1.5'>
                  Next:{" "}
                  {currentProject.tasks.find(
                    (task) => task.status === "Upcoming"
                  )?.title || "Prototype Testing"}
                </p>
              </div>

              <div>
                <p>Deadline</p>
                <div className='flex items-center'>
                  <CalendarIcon className='h-3.75 w-4 mt-0.5' />
                  <span>{currentProject.deadline}</span>
                </div>
              </div>

              <div>
                <p>Project ID</p>
                <span className='text-gray-700'>
                  {currentProject.id || "N/A"}
                </span>
              </div>
            </div>

            <div className='border my-3'></div>

            <div className='flex justify-between mt-6'>
              <p className='w-[396px] text-sm'>
                <strong>Project Description:</strong>{" "}
                {currentProject.description}
              </p>
              <p className='w-[403px] text-sm'>
                <strong>Professor Contact:</strong>{" "}
                {currentProject.professor.contact}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Messages - 4 columns */}
        <Card className='p-4 col-span-4 bg-white border rounded-lg shadow-sm flex flex-col'>
          <div className='flex justify-between items-center border-b pb-2'>
            <div>
              <CardTitle className='text-zinc-950 text-base font-semibold font-inter mb-0.5'>
                Recent Messages
              </CardTitle>
              <p className='text-zinc-500 text-sm font-normal font-inter'>
                You have {currentProject.messages.length} unread messages.
              </p>
            </div>
            <button className='text-zinc-950 text-sm font-semibold font-inter'>
              View All
            </button>
          </div>

          <CardContent className='text-sm flex-grow flex flex-col'>
            <div className='space-y-3 flex-grow'>
              {currentProject.messages.slice(0, 4).map((msg) => (
                <div key={msg.id} className='flex gap-3'>
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.name}
                    className='w-8 h-8 rounded-full'
                  />
                  <div className='flex-1'>
                    <p className='font-medium text-sm'>{msg.sender.name}</p>
                    <p className='text-xs text-gray-600 truncate w-48'>
                      {msg.text}
                    </p>
                  </div>
                  <p className='text-xs text-gray-400'>{msg.timestamp}</p>
                </div>
              ))}
            </div>
            <Button variant='outline' className='w-full mt-2 bg-zinc-100'>
              Reply to Messages
            </Button>
          </CardContent>
        </Card>

        {/* Task Timeline - 8 columns */}
        <Card className='p-4 col-span-8 bg-white border rounded-lg shadow-sm'>
          <div className='flex justify-between items-center mb-3'>
            <CardTitle className='text-lg font-semibold'>
              Task Timeline
            </CardTitle>
            <Button variant='outline' className='text-sm px-3 py-1 rounded-lg'>
              View All Tasks
            </Button>
          </div>

          <CardContent>
            {currentProject.tasks.map((task, index) => (
              <div key={task.id} className='relative pl-6 mb-6'>
                {/* Vertical Line Extending Downward */}
                {index !== currentProject.tasks.length - 1 && (
                  <div className='absolute left-[6px] top-4 w-[2px] h-full bg-gray-300'></div>
                )}

                {/* Task Status Indicator - Matches Image */}
                <div className='absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-black bg-white'>
                  {task.status === "Completed" && (
                    <div className='w-2.5 h-2.5 bg-black rounded-full'></div>
                  )}
                </div>

                {/* Task Details */}
                <div className='flex items-center justify-between'>
                  <p className='font-semibold'>{task.title}</p>
                  <Badge
                    className={`text-xs px-2 py-1 rounded-full
            ${task.status === "Completed" ? "bg-black text-white" : ""}
            ${task.status === "In Progress" ? "bg-gray-300 text-gray-700" : ""}
            ${task.status === "Upcoming" ? "bg-gray-200 text-gray-600" : ""}
          `}>
                    {task.status}
                  </Badge>
                </div>
                <p className='text-xs text-gray-500'>{task.description}</p>
                <p className='text-xs text-gray-500'>Due: {task.dueDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Resources - 4 columns */}
        <Card className='p-4 col-span-4 flex flex-col'>
          <CardHeader className='p-1'>
            <CardTitle className='flex justify-between items-center'>
              <div>
                <div className='text-zinc-950 text-base font-semibold font-inter'>
                  Project Resources
                </div>
                <div className='text-zinc-500 text-sm font-normal font-inter'>
                  Uploaded by your mentor and professors
                </div>
              </div>
              <div className='text-zinc-950 text-sm font-semibold font-inter'>
                View All
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm flex-grow flex flex-col'>
            <div className='space-y-2 flex-grow'>
              {currentProject.resources.map((res) => (
                <div key={res.id} className='flex items-center'>
                  {res.type === "Document" ? (
                    <img src='/file.png' alt='file' />
                  ) : (
                    <img src='/external-link.png' alt='file' />
                  )}
                  {"  "}
                  {res.title}
                </div>
              ))}
            </div>
            <Button className='w-full mt-2'>Access Learning Materials</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverview;
