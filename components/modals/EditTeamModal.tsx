'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Project } from '@/types/interfaces';
import { Check, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { User } from '@/types/interfaces';
import { useRouter } from 'next/navigation';

interface Application {
    id: string;
    applicant: {
        name: string;
        email: string;
    };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    dateOfApplication: string;
}

const EditTeamModal = ({
    isOpen,
    onClose,
    projectData,
    isAuthor,
}: {
    isOpen: boolean;
    onClose: () => void;
    projectData: Project;
    isAuthor: boolean;
}) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [acceptedIds, setAcceptedIds] = useState<string[]>([]); // Track IDs of accepted applications
    const [rejectedIds, setRejectedIds] = useState<string[]>([]); // Track IDs of rejected applications
    const [error, setError] = useState<string | null>(null);
    const [projectMembers, setProjectMembers] = useState<any[]>([]); // Track project members
    const router = useRouter();
    // Prevent background scrolling when the modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        // Cleanup function to reset overflow when the modal is closed
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    // Fetch pending applications for the project
    useEffect(() => {
        if (isOpen && projectData?.id && isAuthor) {
            fetchApplications();
            fetchProjectMembers();
        }
    }, [isOpen, projectData?.id]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/forDashboard/fetch_applications/${projectData.id}`);
            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            setApplications(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

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
            console.log(data);
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

    const handleAction = async (action: 'accept' | 'reject', applicationId: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log(userId, projectData.id, action);

            const response = await fetch(`/api/applications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    projectId: projectData.id,
                    applicationId: applicationId,
                }),
            });

            // Handle redirect responses
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (location) {
                    router.push(location);
                    return;
                }
            }

            // Check if response is HTML (error case)
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/html')) {
                throw new Error('Server returned HTML response');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || 'Failed to process application');
            }

            console.log('Response headers:', Object.fromEntries(response.headers));
            const data = await response.json();
            console.log('Response data:', data);
            fetchApplications(); // Refresh applications after action
            // Return updated data if successful
            fetchProjectMembers();
            setLoading(false);
            alert('Application processed successfully!');

            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        } finally {
            setLoading(false);
        }
    };
    // Save changes and send PUT request
    const saveChanges = async () => {
        try {
            setLoading(true);
            setError('');

            // Send PUT request with accepted and rejected IDs
            const response = await fetch(`/api/forDashboard/update_applications`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acceptedIds, rejectedIds }),
            });

            if (!response.ok) throw new Error('Failed to update application statuses');

            // Clear the accepted and rejected IDs
            setAcceptedIds([]);
            setRejectedIds([]);

            // Close the modal
            onClose();

            // Refresh the applications
            fetchApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update statuses');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectMembers = async () => {
        try {
            const response = await fetch(`/api/forDashboard/fetchProjectMembers/${projectData.id}`);
            const data = await response.json();
            if (!response.ok) throw new Error('Failed to fetch project members');

            console.log(data);
            setProjectMembers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        try {
            const response = await fetch(`/api/forDashboard/fetchProjectMembers/${projectData.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (!response.ok) throw new Error('Failed to remove project member');
            const data = await response.json();
            console.log(data);
            alert('Member removed successfully!');
            // Refresh the project members after removal
            await fetchProjectMembers();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen || !projectData) return null;

    return (
        <div className="fixed inset-0 bg-opacity-40 backdrop-sm bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-medium">Manage Team - {projectData.title}</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            onClose();
                            setAcceptedIds([]);
                            setRejectedIds([]);
                        }}
                        className="text-gray-500 hover:text-gray-700 h-8 w-8"
                    >
                        <X size={18} />
                    </Button>
                </div>

                <div className="p-4">
                    {loading && (
                        <div className="text-sm text-gray-600 mb-4 flex items-center justify-center py-6">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                            Loading applications...
                        </div>
                    )}
                    {error && <p className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded">{error}</p>}

                    {applications.length === 0 && !loading ? (
                        <div className="text-sm text-gray-600 text-center py-8 border rounded-lg bg-gray-50">
                            No pending applications found.
                        </div>
                    ) : (
                        <div className="space-y-3 mt-2">
                            {applications.map((application) => (
                                <div
                                    key={application.id}
                                    className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarFallback className="bg-gray-100 text-gray-800">
                                                {application.applicant.name
                                                    .split(' ')
                                                    .map((word) => word[0])
                                                    .join('')
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{application.applicant.name}</p>
                                            <p className="text-xs text-gray-500">{application.applicant.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {application.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setAcceptedIds([...acceptedIds, application.id]);
                                                        handleAction('accept', application.id);
                                                    }}
                                                    disabled={loading}
                                                    variant={
                                                        acceptedIds.includes(application.id) ? 'default' : 'outline'
                                                    }
                                                    size="sm"
                                                    className={`${
                                                        acceptedIds.includes(application.id)
                                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                                            : 'border-green-600 text-green-600 hover:bg-green-50'
                                                    } transition-colors`}
                                                >
                                                    {loading ? 'Processing...' : 'Accept'}
                                                </Button>

                                                <Button
                                                    onClick={() => {
                                                        setRejectedIds([...rejectedIds, application.id]);
                                                        handleAction('reject', application.id);
                                                    }}
                                                    disabled={loading}
                                                    variant={
                                                        rejectedIds.includes(application.id) ? 'default' : 'outline'
                                                    }
                                                    size="sm"
                                                    className={`${
                                                        rejectedIds.includes(application.id)
                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                            : 'border-red-600 text-red-600 hover:bg-red-50'
                                                    } transition-colors`}
                                                >
                                                    {loading ? 'Processing...' : 'Reject'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">Project Members:</h3>
                    {projectMembers.length === 0 ? (
                        <p className="text-sm text-gray-600">No members found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {projectMembers.map((member) => (
                                <li
                                    key={member.id}
                                    className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarFallback className="bg-blue-100 text-gray-800">
                                                {member.user.name
                                                    ? member.user.name
                                                          .split(' ')
                                                          .map((word) => word[0])
                                                          .join('')
                                                          .toUpperCase()
                                                    : '??'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.user.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{member.user.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {member.user && (
                                            <Button
                                                onClick={() => handleRemoveMember(member.user.id)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex justify-end p-4 border-t sticky bottom-0 bg-white gap-2 shadow-md">
                    <Button variant="outline" onClick={onClose} className="text-gray-700">
                        close
                    </Button>
                    <Button
                        onClick={saveChanges}
                        disabled={acceptedIds.length === 0 && rejectedIds.length === 0}
                        className="bg-black hover:bg-gray-800 text-white disabled:opacity-50"
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditTeamModal;
