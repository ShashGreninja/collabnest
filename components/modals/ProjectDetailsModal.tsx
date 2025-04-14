'use client';
// components/modals/ProjectDetailsModal.tsx
import { X, Calendar, User, Tag, FileText, CheckSquare, PieChart } from 'lucide-react';
import { Project } from '@/types/interfaces';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Link from 'next/link';

const ProjectDetailsModal = ({ isOpen, onClose, proj }: { isOpen: boolean; onClose: () => void; proj: Project }) => {
    if (!isOpen) return null;

    // Calculate completion statistics
    const completedTasks = proj.subtasks.filter((task) => task.status === 'CLOSED').length;
    const inProgressTasks = proj.subtasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const upcomingTasks = proj.subtasks.filter((task) => task.status === 'OPEN').length;
    const totalTasks = proj.subtasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Data for pie chart
    const taskDistributionData = [
        { name: 'Done', value: completedTasks, color: '#16a34a' }, // green-600
        { name: 'Ongoing', value: inProgressTasks, color: '#ea580c' }, // orange-600
        { name: 'Upcoming', value: upcomingTasks, color: '#64748b' }, // slate-500
    ].filter((item) => item.value > 0); // Only show categories with tasks

    return (
        <div className="fixed inset-0 bg-opacity-60 backdrop-brightness-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
                    <h2 className="text-2xl font-semibold">{proj.title}</h2>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="text-white hover:bg-white rounded-md hover:text-blue-600 transition duration-200 ease-in-out"
                    >
                        <X size={24} />
                    </Button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                        {/* Project Overview */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-blue-600" />

                                <h4 className="text-xl font-semibold">{proj.subheading}</h4>
                            </div>
                            <p className="text-gray-700 mb-4">{proj.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {proj.requirementTags.map((tag) => (
                                    <Badge key={tag} className="bg-indigo-100 text-indigo-800">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 mb-1">Project ID</div>
                                    <div className="text-gray-800 font-mono text-sm">{proj.id}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 mb-1">Deadline</div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span>{proj.deadlineToComplete.slice(0, 10)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professor Info */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="h-5 w-5 text-blue-600" />
                                <h3 className="text-xl font-semibold">Professor</h3>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-800 font-medium">{proj.author.name}</p>
                                <p className="text-gray-600 text-sm mt-1">{proj.author.email}</p>
                                {proj.author.department && (
                                    <p className="text-gray-600 text-sm mt-1">Department: {proj.author.department}</p>
                                )}
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="h-5 w-5 text-blue-600" />
                                <h3 className="text-xl font-semibold">Team Members</h3>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                {proj.members && proj.members.length > 0 ? (
                                    <div className="space-y-3">
                                        {proj.members.map((member, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                                                    {member.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <Link href={`/profile/${member.userId}`}>
                                                        <div className="font-medium">{member.user.name}</div>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No team members assigned yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        {/* Task Distribution Pie Chart */}
                        <div className="mb-6  ">
                            <div className="flex items-center gap-1 mb-3">
                                <PieChart className="h-3.5 w-3.5 text-blue-600" />
                                <h3 className="text-xl font-semibold">Task Distribution</h3>
                            </div>
                            <div className="bg-gray-50 p-1 rounded-lg">
                                {totalTasks > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={taskDistributionData}
                                                    cx="55%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) =>
                                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                                    }
                                                >
                                                    {taskDistributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => [`${value} task${value !== 1 ? 's' : ''}`]}
                                                />
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No tasks available to display.</p>
                                )}
                            </div>
                        </div>

                        {/* Task Progress */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                                <h3 className="text-xl font-semibold">Task Progress</h3>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-700">
                                        {completedTasks} of {totalTasks} tasks completed
                                    </span>
                                    <span className="font-medium">{completionPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${completionPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            {proj.subtasks && proj.subtasks.length > 0 ? (
                                <div className="space-y-2">
                                    {proj.subtasks.map((task, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{task.title}</span>
                                                <Badge
                                                    className={`
                            ${
                                task.status === 'CLOSED'
                                    ? 'bg-green-100 text-green-800'
                                    : task.status === 'OPEN'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }
                          `}
                                                >
                                                    {task.status}
                                                </Badge>
                                            </div>
                                            {task.description && (
                                                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No tasks available.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t p-4 flex justify-end">
                    <Button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsModal;
