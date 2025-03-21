'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

const projectId = '437fe1e3-8644-4435-b150-1287f498986d';

export default function GenerateCertificatePage() {
    const handleGenerateCertificate = async () => {
        try {
            const response = await fetch(`/api/generateCertificate/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            alert('Certificate generation request sent successfully!');
            console.log(data);
        } catch (error) {
            console.error('Failed to generate certificate:', error);
            alert('Failed to generate certificate');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-6">Generate Certificate</h1>
            <Button onClick={handleGenerateCertificate} className="text-lg px-6 py-3">
                Generate Certificate
            </Button>
        </div>
    );
}
