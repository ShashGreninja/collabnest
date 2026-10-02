"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    name: string | null;
  } | null;
}

interface ProjectMessagesProps {
  projectId?: string;
}

export function ProjectMessages({ projectId }: ProjectMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/chat/${projectId}/messages`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching preview messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [projectId]);

  const formatTime = (timestamp: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "";
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const recentMessages = messages.slice(-4);

  return (
    <Card className='mb-6'>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-lg font-medium'>Recent Messages</CardTitle>
        </div>
        <p className='text-sm text-gray-500'>You might have unread messages.</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {loading ? (
          <p className='text-sm text-gray-400 py-4 text-center'>Loading messages...</p>
        ) : recentMessages.length > 0 ? (
          <div className='space-y-3'>
            {recentMessages.map((msg, index) => {
              const name = msg.sender?.name || "Unknown";
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 ${
                    index < recentMessages.length - 1 ? "pb-3 border-b" : ""
                  }`}>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='bg-blue-600 text-white text-xs'>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-start'>
                      <p className='font-medium text-sm truncate'>{name}</p>
                      <span className='text-xs text-gray-500 shrink-0 ml-2'>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600 truncate'>{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-6'>
            <Image
              src='/chat.svg'
              alt='No messages'
              width={60}
              height={60}
              className='mx-auto mb-2'
            />
            <p className='text-sm text-gray-500'>No messages yet</p>
          </div>
        )}

        {projectId && (
          <div className='pt-2'>
            <Link
              href={`/dashboard/chat-window/${projectId}`}
              className='text-sm text-blue-600 hover:underline'>
              View All Messages
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
