import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export function ProjectMessages() {
  const messages = [
    {
      avatar: "O",
      name: "Olivia (Mentor)",
      message: "Hey, did you complete it?",
      time: "1h ago",
    },
    {
      avatar: "J",
      name: "Jackson Lee",
      message: "Almost! Just running final checks w...",
      time: "1h ago",
    },
    {
      avatar: "I",
      name: "Isabella.nguyen@email.com",
      message: "Nice! Share the update in the task t...",
      time: "1h ago",
    },
    {
      avatar: "W",
      name: "will@email.com",
      message: "William Kim",
      time: "1h ago",
    },
  ];

  const projectId = "b37e8403-9944-462f-9964-5674386007a6";

  return (
    <Card className='mb-6'>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-lg font-medium'>Recent Messages</CardTitle>
        </div>
        <p className='text-sm text-gray-500'>You might have unread messages.</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              index < messages.length - 1 ? "pb-3 border-b" : ""
            }`}>
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-600 text-white'>
                {msg.avatar}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <div className='flex justify-between items-start'>
                <p className='font-medium truncate'>{msg.name}</p>
                <span className='text-xs text-gray-500 shrink-0 ml-2'>
                  {msg.time}
                </span>
              </div>
              <p className='text-sm text-gray-600 truncate'>{msg.message}</p>
            </div>
          </div>
        ))} */}

          <Image
            src='chat.svg'
            alt='No messages'
            width={60}
            height={60}
            className='mx-auto my-8'
          />

        <Link
        href={`/dashboard/chat-window/${projectId}`}
        className="text-blue-600 underline mt-5"
      >
        View All Messages
      </Link>
      </CardContent>
    </Card>
  );
}
