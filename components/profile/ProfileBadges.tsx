"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaMedal } from "react-icons/fa";
import { BadgeResult, evaluateBadges } from "@/lib/badges";

export const ProfileBadges = ({ id }: { id: string }) => {
  const [badges, setBadges] = useState<BadgeResult[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadBadges = async () => {
      try {
        const [userRes, leaderboardRes] = await Promise.all([
          fetch(`/api/forProfile/byUserId/${id}`),
          fetch("/api/fetchLeaderboard"),
        ]);

        if (!userRes.ok) throw new Error("Failed to fetch user data");

        const user = await userRes.json();
        const leaderboard = leaderboardRes.ok ? await leaderboardRes.json() : [];

        setBadges(
          evaluateBadges({
            role: user.role,
            applications: user.applications ?? [],
            projectCreated: user.projectCreated ?? [],
            projectsParticipated: user.projectsParticipated ?? [],
            messageCount: user._count?.sentMessages ?? 0,
            isRankOne: leaderboard[0]?.id === id,
          })
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadBadges();
  }, [id]);

  const visible = showAll ? badges : badges.slice(0, 4);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Achievements & Badges</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {visible.map((badge) => (
          <div key={badge.key} className="flex flex-col items-center text-center">
            <FaMedal
              size={40}
              className={badge.earned ? "text-yellow-500" : "text-gray-300"}
            />
            <Badge variant={badge.earned ? "default" : "outline"} className="mt-2">
              {badge.name}
            </Badge>
            <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
            {!badge.earned && badge.progress && (
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.min(badge.progress.current, badge.progress.target)}/
                {badge.progress.target}
              </p>
            )}
          </div>
        ))}
      </CardContent>
      {badges.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mb-4 text-sm text-blue-500 hover:underline"
        >
          {showAll ? "View Less" : "View More"}
        </button>
      )}
    </Card>
  );
};
