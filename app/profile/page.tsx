'use client';
import React, { useEffect, useState } from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { CompletedProjects } from '@/components/profile/CompletedProjects';
import { UserDetails } from '@/components/profile/UserDetails';
import { CVSection } from '@/components/profile/CVSection';
import { useSession } from 'next-auth/react';
import { User } from '@/types/interfaces';
import { Loader } from '@/components/profile/Loader';

export default function ProfilePage() {
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

    if (userId !== null) {
        return (
            <>
                <div className="container mx-auto py-8 px-4 md:px-8 lg:max-w-320">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <ProfileHeader id={userId} />
                            <ProfileStats id={userId} />
                            <CompletedProjects id={userId} />
                            <RecentActivity id={userId} />
                        </div>
                        <div>
                            <UserDetails id={userId} />
                            <ProfileBadges id={userId} />
                            <CVSection id={userId} />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="flex items-center justify-center h-40">
            <Loader center text="Loading statistics..." />
        </div>
    );
}
