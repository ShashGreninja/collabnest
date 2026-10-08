"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Mail,
  MapPin,
  Briefcase,
  QrCode,
  University,
} from "lucide-react";

export const UserDetails = ({ id }: { id: string }) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/forProfile/byUserId/${id}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError("Error fetching user details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading)
    return (
      <Card className='mb-6' aria-busy='true' aria-label='Loading personal information'>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid xl:grid-cols-2 gap-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='flex items-center space-x-3 animate-pulse'>
                <div className='h-5 w-5 min-w-5 rounded bg-muted' />
                <div className='flex-1 space-y-2'>
                  <div className='h-3 w-16 rounded bg-muted' />
                  <div className='h-4 w-3/4 rounded bg-muted' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  if (error) return <p className='text-red-500'>{error}</p>;

  const detailsData = [
    {
      icon: MapPin,
      label: "Name",
      value: userData?.name || "N/A",
    },
    {
      icon: QrCode,
      label: "Roll No",
      value: userData?.roll || "N/A",
    },
    {
      icon: GraduationCap,
      label: "Degree",
      value: userData?.degree || "N/A",
    },
    {
      icon: Briefcase,
      label: "Department",
      value: userData?.department || "N/A",
    },
    {
      icon: Mail,
      label: "Email",
      value: userData?.email || "N/A",
    },
    {
      icon: University,
      label: "College",
      value: "Indian Institute of Technology, Patna",
    },
  ];

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid xl:grid-cols-2 gap-4'>
          {detailsData.map((detail) => (
            <div key={detail.label} className='flex items-center space-x-3'>
              <detail.icon className='h-5 w-5 min-w-5 text-muted-foreground' />
              <div>
                <div className='text-sm text-muted-foreground'>
                  {detail.label}
                </div>
                <div
                  className={
                    detail.label === "Email"
                      ? "font-medium break-all"
                      : "font-medium"
                  }>
                  {detail.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
