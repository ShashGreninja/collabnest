import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FaStar } from 'react-icons/fa';

const projects = [
    {
        title: "Project 1",
        description: "Description for project 1",
        tags: ["React", "Next.js", "Tailwind CSS"],
        duration: "4 Weeks",
        timeCommitment: "10 Hrs/week"
    },
    {
        title: "Project 2",
        description: "Description for project 2",
        tags: ["Node.js", "Express", "MongoDB"],
        duration: "8 Weeks",
        timeCommitment: "15 Hrs/week"
    },
    {
        title: "Project 3",
        description: "Description for project 3",
        tags: ["Node.js", "Express", "MongoDB"],
        duration: "6 Weeks",
        timeCommitment: "15 Hrs/week"
    },
    // Add more projects as needed
];

const Discovery = () => {
    return (
        <>

            <div className="mx-5">
                <h1 className='text-3xl mt-5 font-bold'>Discover Recommended Projects</h1>
                <p className='text-gray-900'>Browse projects from professors and research groups across various domains.</p>

                <Input type="text" placeholder="Search projects, skills, professors..." className="w-100 my-4" />
                <div className='flex flex-row space-x-4'>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Domain</SelectLabel>
                                <SelectItem value="dev">Web Development</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Department</SelectLabel>
                                <SelectItem value="ee">Electrical</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Duration</SelectLabel>
                                <SelectItem value="1">1 month</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Time Commitment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Time</SelectLabel>
                                <SelectItem value="10h">10 Hrs</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <Separator className='my-5' />
                <div className="flex flex-wrap gap-4">
                    {projects.map((project, index) => (
                        <Card key={index} className="w-[350px]">
                            <CardHeader>
                                <CardTitle className="text-2xl">{project.title}</CardTitle>
                                <CardDescription>{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap  mb-4">
                                    {project.tags.map((tag, index) => (
                                        <span key={index} className="bg-black text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">{tag}</span>
                                    ))}
                                </div>
                                <p className="text-gray-600 text-sm">{project.timeCommitment}&nbsp;&nbsp;{project.duration}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                                <Button variant="outline" className="w-auto bg-black text-white">Apply</Button>
                                <Button variant="outline" className="w-auto flex items-center">
                                    <FaStar className="mr-0.5" /> Star
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Discovery;