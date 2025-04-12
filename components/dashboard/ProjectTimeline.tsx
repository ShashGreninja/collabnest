import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Subtask, Project } from '@/types/interfaces';

type Status = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export function ProjectTimeline({
    tasks,
    projectId,
    isAuthor = false,
    onTasksUpdated,
}: {
    tasks: Subtask[];
    projectId: string;
    isAuthor?: boolean;
    onTasksUpdated?: (updatedTasks: Subtask[]) => void;
}) {
    const [showAll, setShowAll] = useState(false);
    const [localTasks, setLocalTasks] = useState<Subtask[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize localTasks when tasks or projectId changes
    useEffect(() => {
        if (tasks && tasks.length > 0) {
            setLocalTasks(tasks);
        } else {
            setLocalTasks([]);
        }
    }, [tasks, projectId]);

    // Determine whether to show the toggle button (only if there are more than 3 tasks)
    const showToggleButton = localTasks.length > 3;

    // Filter tasks based on showAll state
    const visibleTasks = showAll ? localTasks : localTasks.slice(-3);

    // Handle task status change
    const handleStatusChange = async (taskId: string, newStatus: Status) => {
        if (!isAuthor) return;

        try {
            setIsLoading(true);

            // Update task locally first for immediate feedback
            const updatedTasks = localTasks.map((task) =>
                task.id === taskId ? { ...task, status: newStatus.replace('_', ' ') } : task
            );

            setLocalTasks(updatedTasks);

            // Call API to update the task status
            const response = await fetch('/api/forDashboard/updateTaskStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    status: newStatus.replace('_', ' '),
                    projectId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            // Notify parent component about the update
            if (onTasksUpdated) {
                onTasksUpdated(updatedTasks);
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            // Revert to original tasks if update fails
            setLocalTasks(tasks);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-xl font-bold">Task Timeline</CardTitle>
                {showToggleButton && (
                    <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} disabled={isLoading}>
                        {showAll ? 'Show Less' : 'View All Tasks'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="relative border-l border-gray-200 pl-6 pb-2 pt-2">
                    {visibleTasks.map((task, index) => {
                        const isLast = index === visibleTasks.length - 1;
                        return (
                            <TimelineItem
                                key={task.id}
                                status={mapping[task.status.replace(' ', '_') as Status]}
                                title={task.title}
                                description={task.description}
                                dueDate={task.deadline ? task.deadline.slice(0, 10) : ''}
                                isLast={isLast}
                                taskId={task.id}
                                onStatusChange={isAuthor ? handleStatusChange : undefined}
                            />
                        );
                    })}

                    {localTasks.length === 0 && <div className="text-gray-500 text-sm py-4">No tasks available.</div>}
                </div>
            </CardContent>
        </Card>
    );
}

// Mapping object to convert Subtask status to TimelineItem status
const mapping: { [key in Status]: 'completed' | 'in-progress' | 'upcoming' } = {
    OPEN: 'upcoming',
    IN_PROGRESS: 'in-progress',
    CLOSED: 'completed',
};

// Reverse mapping for status changes
const reverseMapping: { [key: string]: Status } = {
    upcoming: 'OPEN',
    'in-progress': 'IN_PROGRESS',
    completed: 'CLOSED',
};

interface TimelineItemProps {
    status: 'completed' | 'in-progress' | 'upcoming';
    title: string;
    description: string;
    dueDate: string;
    isLast?: boolean;
    taskId: string;
    onStatusChange?: (taskId: string, newStatus: Status) => void;
}

function TimelineItem({
    status,
    title,
    description,
    dueDate,
    isLast = false,
    taskId,
    onStatusChange,
}: TimelineItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusMap = {
        completed: {
            color: 'bg-green-500',
            badge: (
                <Badge variant="outline" className="text-green-600 bg-green-50 hover:bg-green-100 border-green-200">
                    Completed
                </Badge>
            ),
        },
        'in-progress': {
            color: 'bg-blue-500',
            badge: (
                <Badge variant="outline" className="text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200">
                    In Progress
                </Badge>
            ),
        },
        upcoming: {
            color: 'bg-gray-300',
            badge: (
                <Badge variant="outline" className="text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200">
                    Upcoming
                </Badge>
            ),
        },
    };

    // Handle status change when user clicks on a status
    const handleStatusClick = (newStatus: 'completed' | 'in-progress' | 'upcoming') => {
        if (onStatusChange) {
            onStatusChange(taskId, reverseMapping[newStatus]);
        }
    };

    return (
        <div className={`${!isLast ? 'mb-8' : ''}`}>
            <div
                className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${statusMap[status].color} border-4 border-white`}
            ></div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
                <h3 className="font-medium">{title}</h3>
                <div onClick={() => onStatusChange && setIsExpanded(!isExpanded)}>{statusMap[status].badge}</div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{description}</p>
            <p className="text-xs text-gray-500">Due: {dueDate}</p>

            {/* Status change dropdown - only visible for authors when expanded */}
            {onStatusChange && isExpanded && (
                <div className="mt-2 flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className={`text-green-600 border-green-200 ${status === 'completed' ? 'bg-green-50' : ''}`}
                        onClick={() => handleStatusClick('completed')}
                    >
                        Complete
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className={`text-blue-600 border-blue-200 ${status === 'in-progress' ? 'bg-blue-50' : ''}`}
                        onClick={() => handleStatusClick('in-progress')}
                    >
                        In Progress
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className={`text-gray-600 border-gray-200 ${status === 'upcoming' ? 'bg-gray-50' : ''}`}
                        onClick={() => handleStatusClick('upcoming')}
                    >
                        Upcoming
                    </Button>
                </div>
            )}
        </div>
    );
}
