"use client";
import React, { useEffect, useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { RecentActivity } from "@/components/profile/RecentActivity";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { CompletedProjects } from "@/components/profile/CompletedProjects";
import { UserDetails } from "@/components/profile/UserDetails";
import { CVSection } from "@/components/profile/CVSection";
import { useSession } from "next-auth/react";
import { User } from "@/types/leaderboard";
import { useIsClient } from "../context/isClientContext";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const isClient = useIsClient();
  //console.log(status);
  if (isClient && status != "authenticated") {
    window.location.href = "/welcome";
  }
  const [userId, setId] = useState<string | null>(null);
  const email = session?.user?.email || "";

  const fetchid = async () => {
    try {
      const response = await fetch(
        `/api/forProfile/byEmail/${session?.user?.email}`
      );
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
        <div className='container mx-auto py-8 px-4 md:px-8 lg:max-w-320'>
          <div className='grid lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
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
    <div className='container mx-auto py-8 px-4 md:px-8 lg:max-w-320' aria-busy='true' aria-label='Loading profile'>
      <div className='grid lg:grid-cols-3 gap-6 animate-pulse'>
        <div className='lg:col-span-2 space-y-6'>
          <div className='flex items-center gap-4'>
            <div className='h-20 w-20 rounded-full bg-muted' />
            <div className='space-y-3'><div className='h-6 w-48 rounded bg-muted' /><div className='h-4 w-36 rounded bg-muted' /><div className='h-4 w-56 rounded bg-muted' /></div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>{Array.from({ length: 6 }).map((_, index) => <div key={index} className='h-24 rounded-lg bg-muted' />)}</div>
          <div className='h-64 rounded-lg bg-muted' />
          <div className='h-64 rounded-lg bg-muted' />
        </div>
        <div className='space-y-6'><div className='h-64 rounded-lg bg-muted' /><div className='h-40 rounded-lg bg-muted' /><div className='h-48 rounded-lg bg-muted' /></div>
      </div>
    </div>
  );
}