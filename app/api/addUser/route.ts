// api/users/route.ts or api/users/index.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

function extractProgramCode(rollNumber: string) {
    return rollNumber.substring(2, 4).toUpperCase();
}

function getProgramName(rollNumber: string): string {
    const programs: Record<string, string> = {
        '01': 'BTech',
        '02': 'MTech',
        '11': 'BSc',
        '12': 'MSc',
    };

    const fourYear: string[] = ['CS', 'AI', 'EE', 'EC', 'MC', 'CB', 'CE', 'ME', 'MM', 'EP', 'CT'];

    const programCode = extractProgramCode(rollNumber);
    const branch = extractBranch(rollNumber);

    if (programCode === '01' && !fourYear.includes(branch)) {
        return 'Dual Degree 5 Years';
    }
    return programs[programCode] || 'Unknown Program';
}

function extractBranch(rollNumber: string) {
    return rollNumber.substring(4, 6).toUpperCase();
}

function extractDepartment(branch: string) {
    const branchToDepartment: Record<string, string> = {
        CS: 'Computer Science and Engineering',
        AI: 'Computer Science and Engineering',
        EE: 'Electrical Engineering',
        EC: 'Electrical Engineering',
        VL: 'Electrical Engineering',
        PC: 'Electrical Engineering',
        CM: 'Electrical Engineering',
        MC: 'Mathematics',
        CB: 'Chemical Engineering',
        CT: 'Chemical Engineering',
        CE: 'Civil Engineering',
        GT: 'Civil Engineering',
        ST: 'Civil Engineering',
        ME: 'Mechanical Engineering',
        MM: 'Metallurgical and Materials Engineering',
        EP: 'Engineering Physics',
    };

    return branchToDepartment[branch] || 'No Mapped Department';
}

function extractRollFromEmail(email: string) {
    const userId = email.split('@')[0];
    const isFirstPartInt = !isNaN(parseInt(userId[0]));
    return isFirstPartInt ? userId.split('_')[0].toUpperCase() : userId.split('_')[1].toUpperCase();
}

function extractStartingYear(rollNumber: string) {
    const yearPrefix = rollNumber.substring(0, 2);
    return (2000 + parseInt(yearPrefix, 10)).toString();
}

export async function POST() {
    try {
        // Trust the signed-in session, never the request body, for identity.
        const session = await getServerSession(authOptions);
        const email = session?.user?.email;
        const name = session?.user?.name;

        if (!session || !email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate inputs
        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required fields' }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Email already exists, don't do anything
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 200 });
        }

        const roll = extractRollFromEmail(email);
        const branch = extractBranch(roll);
        const degree = getProgramName(roll);
        const year = extractStartingYear(roll);
        const department = extractDepartment(branch);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                roll: roll,
                branch: branch,
                degree: degree,
                year: year,
                department: department,
            },
        });

        return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
