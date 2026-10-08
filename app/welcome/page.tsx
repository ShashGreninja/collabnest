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
    const [error, setError] = useState<string | null>(null);

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
        // When user is authenticated, create or check user in the database.
        // Identity is read from the session server-side; no body is sent.
        // Only redirect when /api/addUser reports success — otherwise
        // retry once and surface the error instead of redirecting.
        const createUserIfNeeded = async () => {
            if (status === 'authenticated' && session?.user?.name && session?.user?.email) {
                setIsLoading(true);
                setError(null);
                try {
                    // Call your API to create the user (will handle existing emails)
                    let response = await fetch('/api/addUser', {
                        method: 'POST',
                    });

                    if (!response.ok) {
                        await new Promise((r) => setTimeout(r, 500));
                        response = await fetch('/api/addUser', {
                            method: 'POST',
                        });
                    }

                    if (!response.ok) {
                        const errData = await response.json().catch(() => null);
                        throw new Error(errData?.error || `User creation failed (${response.status})`);
                    }

                    const data = await response.json();
                    console.log('User creation response:', data);

                    // Redirect to dashboard after user is created or verified
                    window.location.href = '/dashboard';
                } catch (error) {
                    console.error('Error creating user:', error);
                    setError(error instanceof Error ? error.message : 'Failed to create user. Please retry.');
                    setIsLoading(false);
                }
            }
        };

        createUserIfNeeded();
    }, [status, session]);

    const handleRetry = () => {
        setError(null);
        setIsLoading(false);
        // Re-trigger creation by reloading session state path:
        // simplest is to re-run via a manual fetch identical to the effect.
        window.location.reload();
    };

    const handleSignIn = () => {
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
                        {error && (
                            <div className="mt-4 text-center">
                                <p className="text-sm text-red-600">❌ {error}</p>
                                <button
                                    className="mt-2 text-sm text-blue-600 hover:underline"
                                    onClick={handleRetry}
                                >
                                    Retry
                                </button>
                            </div>
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
