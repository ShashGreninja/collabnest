'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { LeaderboardHeader } from '@/components/leaderboard/LeaderboardHeader';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { Card, CardContent } from '@/components/ui/card';
import { LeaderboardEntry } from '@/types/interfaces';

// Contexts
const LeaderboardContext = createContext<{
    filteredEntries: LeaderboardEntry[];
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}>({
    filteredEntries: [],
    searchQuery: '',
    setSearchQuery: () => {},
});

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filteredEntries, setFilteredEntries] = useState<LeaderboardEntry[]>(leaderboardData);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEntries(leaderboardData); // Reset to all projects if search query is empty
        } else {
            filterProjectsBySearch(); // Filter projects for non-empty queries
        }
    }, [searchQuery, leaderboardData]); // Trigger whenever searchQuery or leaderboardData changes

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('/api/fetchLeaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard data');
            }
            const data = await response.json();
            setLeaderboardData(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const filterProjectsBySearch = () => {
        const query = searchQuery.trim().toLowerCase();
        const result = leaderboardData.filter((entry) => {
            return (
                (entry.name?.toLowerCase() || '').includes(query) ||
                (entry.department?.toLowerCase() || '').includes(query)
            );
        });
        setFilteredEntries(result.length > 0 ? result : []); // Set to empty array if no match
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <LeaderboardContext.Provider value={{ filteredEntries, searchQuery, setSearchQuery }}>
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <LeaderboardHeader />
                <Card>
                    <CardContent className="pt-6">
                        <LeaderboardTable entries={filteredEntries} />
                    </CardContent>
                </Card>
            </div>
        </LeaderboardContext.Provider>
    );
}

// Custom hook for consuming the context
export const useLeaderboardContext = () => useContext(LeaderboardContext);
