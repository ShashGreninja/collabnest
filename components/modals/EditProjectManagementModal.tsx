import React, { useState, useEffect } from 'react';
import { Project } from '@/types/interfaces';
import { Button } from '../ui/button';
import { Label } from '@radix-ui/react-dropdown-menu';
import { Input } from '../ui/input';

const EditProjectModal = ({
    isOpen,
    onClose,
    projectData,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    projectData: Project;
    onSave: (data: {
        project_id: string;
        title: string;
        description: string;
        tags: string[];
        deadline: string;
    }) => void;
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [deadline, setDeadline] = useState('');
    const [newTag, setNewTag] = useState('');

    // Reset form state when projectData changes
    useEffect(() => {
        if (projectData) {
            setTitle(projectData.title || '');
            setDescription(projectData.description || '');
            setTags(projectData.requirementTags || []);
            setDeadline(projectData.deadlineToComplete || '');
        }
    }, [projectData]);

    const handleSave = () => {
        onClose();
        onSave({
            project_id: projectData.id,
            title,
            description,
            tags,
            deadline,
        });
    };

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
        }
        setNewTag(''); // Clear input field
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && projectData) {
            setTitle(projectData.title || '');
            setDescription(projectData.description || '');
            setTags(projectData.requirementTags || []);
            setDeadline(projectData.deadlineToComplete || '');
        }
    }, [isOpen, projectData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-opacity-60 backdrop-brightness-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-medium">Edit project details</h2>
                    <Button onClick={onClose} className="text-gray-100 hover:text-gray-50 bg-gray-800">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </Button>
                </div>

                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-6">
                        Make changes to your project here. Click save when you're done.
                    </p>

                    <div className="mb-4">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">Title</Label>
                        <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter Title"
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">Description</Label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded h-24 resize-none"
                            placeholder="Enter description"
                        />
                    </div>

                    <div className="mb-4">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                                >
                                    {tag}
                                    <button
                                        onClick={() => removeTag(index)}
                                        className="ml-2 text-blue-800 hover:text-red-600"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                className="w-full p-2 border rounded"
                                placeholder="Add a tag and press Enter"
                            />
                            <Button
                                onClick={addTag}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="mb-2">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">Deadline</Label>
                        <div className="relative">
                            <Input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full p-2 border rounded pr-10"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t">
                    <Button onClick={handleSave} className="bg-black hover:bg-black text-white px-4 py-2 rounded">
                        Save changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditProjectModal;
