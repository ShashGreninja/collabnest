'use client';
import Link from 'next/link';
import Image from 'next/image';
import { colors } from '@/const';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';

function SearchParamComponent() {
    const params = useSearchParams();
    const error = params.get('error');
    return <>
        {error === 'not-iitp' && (
            <p style={{ color: 'red' }}>❌ Only @iitp.ac.in email addresses are allowed.</p>
        )}
        </>;
}

export default function LandingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [addUserError, setAddUserError] = useState<string | null>(null);

    const { data: session, status } = useSession();
    console.log('Session -----------> ', session);

    // Session ----------->  {
    //     user: {
    //       name: 'Rishikumar Heeralal Gautam',
    //       email: 'rishi_2301cs83@iitp.ac.in',
    //       image: null
    //     }
    //   }

    useEffect(() => {
        // When user is authenticated, create or check user in the database
        const createUserIfNeeded = async () => {
            if (status === 'authenticated' && session?.user?.name && session?.user?.email) {
                setIsLoading(true);
                setAddUserError(null);
                // POST uses the server session for identity; no body needed.
                // Retry once on failure, then surface the error instead of
                // redirecting as if the user was created.
                const maxAttempts = 2;
                let lastError: string = 'Failed to create user';
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        // Call your API to create the user (will handle existing emails)
                        const response = await fetch('/api/addUser', {
                            method: 'POST',
                        });

                        let data: { error?: string; message?: string } | null = null;
                        try {
                            data = await response.json();
                        } catch {
                            data = null;
                        }
                        console.log('User creation response:', data);

                        if (!response.ok || data?.error) {
                            lastError = data?.error || `User setup failed (status ${response.status})`;
                            throw new Error(lastError);
                        }

                        // Redirect to dashboard only after user is created or verified
                        window.location.href = '/dashboard';
                        return;
                    } catch (error) {
                        lastError = error instanceof Error ? error.message : 'Failed to create user';
                        console.error(`Error creating user (attempt ${attempt}/${maxAttempts}):`, error);
                        if (attempt < maxAttempts) {
                            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
                        }
                    }
                }
                setAddUserError(`${lastError}. Please try signing in again.`);
                setIsLoading(false);
            }
        };

        createUserIfNeeded();
    }, [status, session]);

    const handleSignIn = () => {
        setAddUserError(null);
        setIsLoading(true);
        signIn('azure-ad');
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Left Section - Dark Background */}
            <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col" style={{ backgroundColor: colors.dark }}>
                {/* Logo and Brand */}
                <div className="mb-4 md:mb-8 flex items-center justify-center md:justify-start">
                    <Image src="/Logo.svg" alt="CollabNest Logo" width={145} height={145} className="mr-2" />
                </div>
                {/* Spacer to push tagline to bottom on larger screens */}
                <div className="flex-grow"></div>
                {/* Tagline */}
                <div className="mt-4 md:mt-auto text-center md:text-left">
                    <p className="text-white text-base md:text-l leading-relaxed">
                        Learn, collaborate, and grow with real-world projects, mentor support, and a community that
                        helps you turn learning into impact.
                    </p>
                </div>
            </div>
            {/* Right Section - White Background with Login */}
            <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-md">
                    {/* Login Header */}
                    <div className="text-center mb-4 md:mb-8">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Login to CollabNest</h1>
                        <p className="text-gray-600">Securely sign in with your Microsoft account</p>
                    </div>
                    {/* Microsoft Login Button with Loader */}
                    <div className="mt-4 md:mt-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-2 text-gray-700">Authenticating...</span>
                            </div>
                        ) : (
                            <button
                                className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={handleSignIn}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                                    <path fill="#18181B" d="M1 1h10v10H1z" />
                                    <path fill="#18181B" d="M1 13h10v10H1z" />
                                    <path fill="#18181B" d="M13 1h10v10H13z" />
                                    <path fill="#18181B" d="M13 13h10v10H13z" />
                                </svg>
                                Microsoft
                            </button>
                        )}
                        <Suspense>
                            <SearchParamComponent />
                        </Suspense>
                        {addUserError && (
                            <p role="alert" className="mt-3 text-center text-sm text-red-600">
                                {addUserError}
                            </p>
                        )}
                    </div>
                    {/* Terms of Service */}
                    <div className="mt-4 md:mt-6 text-center text-sm text-gray-500">
                        By clicking continue, you agree to our{' '}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </div>
                </div>
            </div>
        </div>
    );
}
/* vi: set et sw=4: */
