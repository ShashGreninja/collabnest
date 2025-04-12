'use client';
// components/modals/ContactProfessorModal.tsx
import { useState } from 'react';
import { X, User as Banda, Mail, FileText, Paperclip } from 'lucide-react';
import { User } from '@/types/interfaces';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@radix-ui/react-label';
import { Separator } from '../ui/separator';

const ContactProfessorModal = ({
    isOpen,
    onClose,
    professorData,
    projectId,
    projectName,
}: {
    isOpen: boolean;
    onClose: () => void;
    professorData: User;
    projectId: string;
    projectName: string;
}) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onClose(); // Close modal after submission
    };

    const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    };

    return (
        <div className="fixed inset-0 bg-opacity-60 backdrop-brightness-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
                    <h2 className="text-2xl font-semibold">Contact Professor</h2>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="text-white hover:bg-white rounded-md hover:text-blue-600 transition duration-200 ease-in-out"
                    >
                        <X size={24} />
                    </Button>
                </div>

                <div className="p-6">
                    {/* Professor Information */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Banda className="h-5 w-5 text-blue-600" />
                            <h3 className="text-xl font-semibold">Professor Information</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                            {professorData.picture ? (
                                <img
                                    src={professorData.picture}
                                    alt={professorData.name}
                                    className="w-16 h-16 rounded-full mr-4"
                                />
                            ) : (
                                <div className="bg-blue-100 text-blue-800 rounded-full w-16 h-16 flex items-center justify-center font-bold mr-4">
                                    {getInitials(professorData.name)}
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-lg">{professorData.name}</div>
                                <div className="text-gray-600 text-sm">{professorData.email}</div>
                                <div className="text-gray-600 text-sm">{professorData.department} Department</div>
                            </div>
                        </div>
                    </div>

                    {/* Project Reference */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h3 className="text-xl font-semibold">Project Reference</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Project Name</div>
                                    <div className="text-gray-800 font-medium">{projectName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Project ID</div>
                                    <div className="text-gray-800 font-mono text-sm">{projectId}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Form */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <h3 className="text-xl font-semibold">Compose Message</h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <Label htmlFor="subject" className="block mb-2 font-medium text-gray-700">
                                    Subject
                                </Label>
                                <Input
                                    type="text"
                                    id="subject"
                                    value={subject}
                                    placeholder="Enter Subject"
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <Label htmlFor="message" className="block mb-2 font-medium text-gray-700">
                                    Message
                                </Label>
                                <textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-32"
                                    placeholder="Type your message here..."
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Paperclip className="h-4 w-4 text-blue-600" />
                                    <Label htmlFor="attachment" className="font-medium text-gray-700">
                                        Attachment
                                    </Label>
                                </div>

                                {/* Hidden File Input */}
                                <input type="file" id="attachment" onChange={handleAttachment} className="hidden" />

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    {/* Styled Button for File Input */}
                                    <Label
                                        htmlFor="attachment"
                                        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition inline-block"
                                    >
                                        Choose File
                                    </Label>

                                    {/* Display File Name if Selected */}
                                    {attachment ? (
                                        <div className="text-sm text-gray-600 mt-4">
                                            Selected: {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 mt-4">No file chosen</div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="border-t p-4 flex justify-end gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Send Message
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ContactProfessorModal;
