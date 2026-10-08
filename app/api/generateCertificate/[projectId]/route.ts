import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { sendMail } from '@/lib/sendMail.server.ts';
import { getAuthenticatedUser, getOwnedProject } from '@/lib/auth';

const prisma = new PrismaClient();

// const handleGenerateCertificate = async () => {
//     try {
//         const response = await fetch(`/api/generateCertificate/${projectId}`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });

//         if (!response.ok) {
//             throw new Error(`Error: ${response.status}`);
//         }

//         const data = await response.json();
//         alert('Certificate generation request sent successfully!');
//         console.log(data);
//     } catch (error) {
//         console.error('Failed to generate certificate:', error);
//         alert('Failed to generate certificate');
//     }
// };

async function generateCertificate(user: any, projectId: string) {
    const canvas = createCanvas(1000, 700);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 150);
    ctx.font = '24px Arial';
    ctx.fillText('This is to certify that', canvas.width / 2, 250);
    ctx.font = 'bold 40px Georgia';
    ctx.fillText(user.name, canvas.width / 2, 330);
    ctx.font = '24px Arial';
    ctx.fillText('has successfully completed the project.', canvas.width / 2, 400);
    ctx.font = '20px Arial';
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 2, 500);

    const buffer = canvas.toBuffer('image/png');
    const fileName = `${projectId}-${user.id}-certificate.png`;
    const filePath = path.join(process.cwd(), 'public', 'certificates', fileName);
    fs.writeFileSync(filePath, buffer);

    await sendMail({
        to: user.email,
        subject: 'Certificate of Completion',
        message: 'Congratulations! You have successfully completed the project.',
        attachmentPath: filePath,
        attachmentFilename: fileName,
        htmlMessage: '<h1>Congratulations!</h1><p>You have successfully completed the project.</p>',
    });

    // const certificateUrl = `/certificates/${fileName}`;

    // await prisma.projectMember.update({
    //     where: { id: member.id },
    //     data: { certificateUrl },
    // });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = await params;

    try {
        // Only the project author or an admin may issue certificates
        const project = await getOwnedProject(authUser, projectId);
        if (!project) {
            return NextResponse.json({ error: 'Project not found or forbidden' }, { status: 403 });
        }
        if (project.status !== 'CLOSED') {
            return NextResponse.json({ error: 'Certificates can only be issued for closed projects' }, { status: 409 });
        }

        // Only members who actually completed the project
        const members = await prisma.projectMember.findMany({
            where: { projectId, completedAt: { not: null } },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        if (members.length === 0) {
            return NextResponse.json({ error: 'No completed project members found' }, { status: 404 });
        }

        const certDir = path.join(process.cwd(), 'public', 'certificates');
        if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

        let sent = 0;
        let skipped = 0;
        for (const member of members) {
            // Idempotency: never re-send a certificate that was already issued
            const existing = path.join(certDir, `${projectId}-${member.user.id}-certificate.png`);
            if (fs.existsSync(existing)) { skipped++; continue; }
            await generateCertificate(member.user, projectId);
            sent++;
        }

        return NextResponse.json({ success: true, sent, skipped });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate certificates' }, { status: 500 });
    }
}
