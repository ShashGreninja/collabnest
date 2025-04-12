'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
    // const [showSearchMobile, setShowSearchMobile] = useState(false);

    // const toggleSearchMobile = () => {
    //   setShowSearchMobile(!showSearchMobile);
    // };
    const { data: session, status } = useSession();

    const getInitials = (name: string) => {
        const names = name.split(' ');
        const initials = names.map((n) => n[0]).join('');
        return initials.toUpperCase();
    };

    const userInitials = session?.user?.name ? getInitials(session.user.name) : 'CN';

    return (
        <nav className="flex items-center justify-between px-4 md:px-9 bg-white text-gray-600 h-16 relative">
            {/* Logo - always visible */}
            <div className="flex items-center">
                <Link href="/" className="text-xl font-bold">
                    <Image src="/Logo-black.svg" alt="CollabNest Logo" width={120} height={120} className="mr-2" />
                </Link>

                <div className="hidden md:flex items-center space-x-4 m-3">
                    <Link href="/dashboard" className="hover:text-black">
                        My Projects
                    </Link>
                    <Link href="/discover-new" className="hover:text-black">
                        Discover
                    </Link>
                    <Link href="/leaderboard" className="hover:text-black">
                        Leaderboard
                    </Link>
                    <Link href="/profile" className="hover:text-black">
                        Profile
                    </Link>
                </div>
            </div>

            {/* {showSearchMobile && (
        <div className="absolute inset-0 flex items-center  bg-white px-4 h-16 z-10">
          <Input 
            type="text" 
            placeholder="Search..." 
            className="flex-grow" 
            autoFocus
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSearchMobile} 
            className="ml-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )} */}

            <div className="flex items-center space-x-2">
                {/* <div className="hidden md:block xl:w-64 md:w-40">
          <Input type="text" placeholder="Search..." />
        </div> */}

                {/* <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={toggleSearchMobile}
        >
          <Search className="h-5 w-5" />
        </Button> */}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-48 bg-white/95 border border-gray-200 shadow-xl rounded-md backdrop-blur-sm"
                        align="end"
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                href="/profile"
                                className="w-full block px-2 py-1.5 text-base text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: '/welcome' })}
                            className="w-full px-2 py-1.5 text-base text-red-600 hover:bg-gray-100 rounded-md cursor-pointer"
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* <Link href="/profile">
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </Link> */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" aria-describedby={undefined} className="p-5">
                        <SheetHeader>
                            <SheetTitle className="text-2xl">Menu</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col space-y-4 px-5 mt-6">
                            <SheetClose asChild>
                                <Link href="/dashboard" className="py-2 hover:text-black">
                                    My Projects
                                </Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/discover" className="py-2 hover:text-black">
                                    Discover
                                </Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/leaderboard" className="py-2 hover:text-black">
                                    Leaderboard
                                </Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/profile" className="py-2 hover:text-black">
                                    Profile
                                </Link>
                            </SheetClose>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
