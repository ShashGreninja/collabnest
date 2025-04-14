'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PlusIcon, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Subtask } from '@/types/interfaces';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: {
        id: string;
        name: string;
    };
    onCreate: (projectData: {
        title: string;
        description: string;
        tags: string[];
        difficulty: string;
        deadlineToApply: string;
        deadlineToComplete: string;
        applicantCapacity: number;
        selectionCapacity: number;
        subheading: string;
        subtasks: Subtask[];
        authorId: string;
    }) => void;
}

export default function CreateProjectModal({ isOpen, onClose, currentUser, onCreate }: CreateProjectModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState('BEGINNER');
    const [deadlineToApply, setDeadlineToApply] = useState('');
    const [deadlineToComplete, setDeadlineToComplete] = useState('');
    const [applicantCapacity, setApplicantCapacity] = useState(100);
    const [selectionCapacity, setSelectionCapacity] = useState(10);
    const [subheading, setSubheading] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setTags([]);
        setDifficulty('BEGINNER');
        setDeadlineToApply('');
        setDeadlineToComplete('');
        setApplicantCapacity(100);
        setSelectionCapacity(10);
        setSubheading('');
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleCreateProject = async () => {
        if (!title || !description || !deadlineToApply || !deadlineToComplete) {
            alert('Please fill all required fields.');
            return;
        }

        setIsSubmitting(true);

        const projectData = {
            title,
            subheading,
            description,
            tags: tags
                .join(',')
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t),
            difficulty,
            subtasks: [],
            deadlineToApply: new Date(deadlineToApply).toISOString(),
            deadlineToComplete: new Date(deadlineToComplete).toISOString(),
            applicantCapacity,
            selectionCapacity,
            authorId: currentUser.id,
        };

        try {
            const response = await fetch('/api/projects/Create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData),
            });

            if (!response.ok) throw new Error('Failed to create project');

            const data = await response.json();
            onCreate(data);
            handleClose();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-lg">
                <DialogHeader className="sticky top-0 bg-white border-b p-6 z-10">
                    <DialogTitle className="text-2xl font-bold text-gray-800">Create New Project</DialogTitle>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    {/* Project Title and Subheading */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="title" className="text-lg font-medium text-gray-700 mb-2 block">
                                    Project Title *
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Enter project title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-lg p-4 h-14 rounded-md border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="subheading" className="text-lg font-medium text-gray-700 mb-2 block">
                                    Subheading
                                </Label>
                                <Input
                                    id="subheading"
                                    placeholder="Enter a short subheading"
                                    value={subheading}
                                    onChange={(e) => setSubheading(e.target.value)}
                                    className="p-4 h-14 rounded-md border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="difficulty" className="text-lg font-medium text-gray-700 mb-2 block">
                                    Difficulty Level
                                </Label>
                                <Select value={difficulty} onValueChange={setDifficulty}>
                                    <SelectTrigger className="h-14 text-base rounded-md border-gray-300">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BEGINNER" className="text-base">
                                            Beginner
                                        </SelectItem>
                                        <SelectItem value="INTERMEDIATE" className="text-base">
                                            Intermediate
                                        </SelectItem>
                                        <SelectItem value="ADVANCED" className="text-base">
                                            Advanced
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description" className="text-lg font-medium text-gray-700 mb-2 block">
                                Project Description *
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your project in detail..."
                                rows={8}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="text-base p-4 h-64 rounded-md border-gray-300 resize-none"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <Label htmlFor="tags" className="text-lg font-medium text-gray-700 mb-2 block">
                            Tags
                        </Label>
                        <Input
                            id="tags"
                            placeholder="Comma separated tags (e.g., React, Node.js)"
                            value={tags.join(', ')}
                            onChange={(e) => setTags(e.target.value.split(',').map((t) => t.trim()))}
                            className="p-4 h-14 rounded-md border-gray-300"
                        />
                        <p className="text-sm text-gray-500 mt-2">Separate tags with commas</p>
                    </div>

                    {/* Project Configuration */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Project Configuration</h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label
                                        htmlFor="deadlineToApply"
                                        className="text-base font-medium text-gray-700 mb-2 block"
                                    >
                                        Application Deadline *
                                    </Label>
                                    <Input
                                        id="deadlineToApply"
                                        type="date"
                                        value={deadlineToApply}
                                        onChange={(e) => setDeadlineToApply(e.target.value)}
                                        className="p-3 h-14 rounded-md border-gray-300"
                                    />
                                </div>

                                <div>
                                    <Label
                                        htmlFor="deadlineToComplete"
                                        className="text-base font-medium text-gray-700 mb-2 block"
                                    >
                                        Completion Deadline *
                                    </Label>
                                    <Input
                                        id="deadlineToComplete"
                                        type="date"
                                        value={deadlineToComplete}
                                        onChange={(e) => setDeadlineToComplete(e.target.value)}
                                        className="p-3 h-14 rounded-md border-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label
                                        htmlFor="applicantCapacity"
                                        className="text-base font-medium text-gray-700 mb-2 block"
                                    >
                                        Applicant Capacity
                                    </Label>
                                    <Input
                                        id="applicantCapacity"
                                        type="number"
                                        min="1"
                                        value={applicantCapacity}
                                        onChange={(e) =>
                                            setApplicantCapacity(Math.max(1, parseInt(e.target.value) || 100))
                                        }
                                        className="p-4 h-14 rounded-md border-gray-300"
                                    />
                                </div>

                                <div>
                                    <Label
                                        htmlFor="selectionCapacity"
                                        className="text-base font-medium text-gray-700 mb-2 block"
                                    >
                                        Selection Capacity
                                    </Label>
                                    <Input
                                        id="selectionCapacity"
                                        type="number"
                                        min="1"
                                        value={selectionCapacity}
                                        onChange={(e) =>
                                            setSelectionCapacity(Math.max(1, parseInt(e.target.value) || 10))
                                        }
                                        className="p-4 h-14 rounded-md border-gray-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-4">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-12 px-8 text-base rounded-md border-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateProject}
                        className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
