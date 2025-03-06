import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  return (
    <nav className='flex items-center justify-between px-9 bg-white text-gray-600'>
      <div className='flex items-center h-16'>
        <Link href='/' className='text-xl font-bold'>
          <Image
            src='/Logo-black.svg'
            alt='CollabNest Logo'
            width={160}
            height={160}
            className='mr-2'
          />
        </Link>
        <div className='flex items-center space-x-4 m-3'>
          <Link href='/dashboard' className='hover:text-black'>
            My Projects
          </Link>
          <Link href='/discovery' className='hover:text-black'>
            Discover
          </Link>
          <Link href='/leaderboard' className='hover:text-black'>
            Leaderboard
          </Link>
          <Link href='/welcome' className='hover:text-black'>
            Profile
          </Link>
        </div>
      </div>
      <div className='flex items-center space-x-4'>
        <Input type='text' placeholder='Search...' />
        <Avatar>
          <AvatarImage src='https://github.com/shadcn.png' />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
