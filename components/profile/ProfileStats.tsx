'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, BookOpen, Target } from 'lucide-react';
import { Project, ProjectMember } from '@/types/interfaces';
import { Loader } from './Loader';

export const ProfileStats = ({ id }: { id: string }) => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any[]>([]);
    const [ratingData, setRatingData] = useState<any[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/forProfile/byUserId/${id}`);
                if (!response.ok) throw new Error('Failed to fetch user data');

                const data = await response.json();
                setUserData(data);
                console.log(userData);
            } catch (err) {
                setError('Error fetching user details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUserData();
        }
    }, [id]);

    useEffect(() => {
        if (!userData) return;
        console.log(userData);
        console.log(userData?.projectCreated?.length || 0);
        setStats([
            {
                icon: Trophy,
                title: 'Total Projects',
                value: (userData?.projectsParticipated?.length || 0) + (userData?.projectCreated?.length || 0),
            },
            {
                icon: Star,
                title: 'Total Applications',
                value: userData?.applications?.length || 0,
            },
            {
                icon: Trophy,
                title: 'Contributor Rating',
                value: userData?.rating || 'N/A',
                color: 'text-yellow-500',
            },
        ]);

        const countProjectsByDifficulty = (difficulty: string) =>
            (userData?.projectsParticipated?.filter(
                (projectMember: ProjectMember) => projectMember.project.difficultyTag?.toUpperCase() === difficulty
            )?.length || 0) +
            (userData?.projectCreated?.filter((project: Project) => project.difficultyTag?.toUpperCase() === difficulty)
                ?.length || 0);

        setRatingData([
            {
                icon: BookOpen,
                title: 'Beginner projects',
                value: countProjectsByDifficulty('BEGINNER'),
                color: 'text-yellow-500',
            },
            {
                icon: Star,
                title: 'Intermediate Projects',
                value: countProjectsByDifficulty('INTERMEDIATE'),
                color: 'text-blue-500',
            },
            {
                icon: Target,
                title: 'Advanced Projects',
                value: countProjectsByDifficulty('ADVANCED'),
                color: 'text-green-500',
            },
        ]);
    }, [userData]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-40">
                <Loader center text="Loading statistics..." />
            </div>
        );

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}

            {ratingData.map((rating) => (
                <Card key={rating.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{rating.title}</CardTitle>
                        <rating.icon className={`h-4 w-4 ${rating.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rating.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
