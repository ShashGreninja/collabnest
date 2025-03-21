// npx prisma db seed

import prisma from '../config/prismaClient';

const students = [
    { name: 'Alice Verma', degree: 'BTech', year: '2024', branch: 'CS', serial: '01' },
    { name: 'Rohit Kumar', degree: 'MTech', year: '2023', branch: 'EE', serial: '02' },
    { name: 'Sneha Mehta', degree: 'BTech', year: '2023', branch: 'EE', serial: '03' },
    { name: 'Ankit Sharma', degree: 'BTech', year: '2023', branch: 'ME', serial: '04' },
    { name: 'Meera Joshi', degree: 'BTech', year: '2022', branch: 'EE', serial: '05' },
    { name: 'Nikhil Singh', degree: 'MTech', year: '2021', branch: 'CS', serial: '06' },
    { name: 'Riya Patel', degree: 'BTech', year: '2023', branch: 'EE', serial: '07' },
    { name: 'Arjun Das', degree: 'BTech', year: '2024', branch: 'ME', serial: '08' },
    { name: 'Kriti Nair', degree: 'BTech', year: '2023', branch: 'CS', serial: '09' },
    { name: 'Varun Rathi', degree: 'BTech', year: '2024', branch: 'EE', serial: '10' },
];

const degreeCodes: Record<string, string> = {
    BTech: '01',
    MTech: '02',
};

async function add_students() {
    for (const student of students) {
        const { name, degree, year, branch, serial } = student;
        const degreeCode = degreeCodes[degree];
        const roll = `${year.slice(2)}${degreeCode}${branch}${serial.padStart(2, '0')}`;
        const firstName = name.split(' ')[0].toLowerCase();
        const email = `${firstName}_${roll}@iitp.ac.in`;

        await prisma.user.create({
            data: {
                username: firstName + '_' + roll.toLowerCase(),
                name,
                roll,
                email,
                password: 'testpass123', // Replace with hashed password in prod
                degree,
                year,
                department: branch,
                role: 'USER',
            },
        });
    }
}

const professors = [
    { name: 'Suresh Gupta', department: 'CS' },
    { name: 'Anjali Reddy', department: 'EE' },
    { name: 'Vikram Sinha', department: 'EE' },
    { name: 'Meena Kaur', department: 'ME' },
    { name: 'Rajiv Mehta', department: 'CS' },
    { name: 'Neha Sharma', department: 'EE' },
    { name: 'Ramesh Joshi', department: 'EE' },
    { name: 'Deepa Verma', department: 'ME' },
    { name: 'Arvind Rao', department: 'CS' },
    { name: 'Kavita Iyer', department: 'EE' },
];

async function seedProfessors() {
    for (const prof of professors) {
        const [firstName, lastName] = prof.name.split(' ');
        const username = `${firstName.toLowerCase()}_${prof.department.toLowerCase()}`;
        const email = `${firstName.toLowerCase()}_${prof.department.toLowerCase()}@iitp.ac.in`;

        await prisma.user.create({
            data: {
                username,
                name: prof.name,
                email,
                department: prof.department,
                password: 'testpass123', // Replace with hashed password in production
                role: 'PROFESSOR',
            },
        });
    }
}

const admins = [{ name: 'Alok Sharma' }, { name: 'Divya Patel' }, { name: 'Ravi Kumar' }, { name: 'Sneha Nair' }];

async function seedAdmins() {
    for (const admin of admins) {
        const [firstName, lastName] = admin.name.split(' ');
        const username = `${firstName.toLowerCase()}_admin`;
        const email = `${firstName.toLowerCase()}_admin@iitp.ac.in`;

        await prisma.user.create({
            data: {
                username,
                name: admin.name,
                email,
                department: 'ADMIN',
                password: 'adminpass123',
                role: 'ADMIN',
            },
        });
    }
}

async function generateProjects() {
    const professorsList = await prisma.user.findMany({
        where: { role: 'PROFESSOR' },
    });

    if (professorsList.length === 0) {
        console.log('No professors found. Skipping project generation.');
        return;
    }

    const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    const tags = [
        'AI',
        'ML',
        'WebDev',
        'IoT',
        'Blockchain',
        'Design',
        'DataScience',
        'Cybersecurity',
        'Networking',
        'Robotics',
        'Embedded',
        'MobileDev',
    ];

    for (let i = 1; i <= 10; i++) {
        const author = professorsList[Math.floor(Math.random() * professorsList.length)];

        await prisma.project.create({
            data: {
                title: `Project ${i}`,
                subheading: `Subheading for Project ${i}`,
                description: `This is a sample description for Project ${i}.`,
                difficultyTag: difficulties[Math.floor(Math.random() * difficulties.length)],
                requirementTags: [
                    tags[Math.floor(Math.random() * tags.length)],
                    tags[Math.floor(Math.random() * tags.length)],
                ],
                projectResources: [
                    {
                        type: 'link',
                        name: 'GitHub Repo',
                        url: 'https://github.com/example/project',
                    },
                    {
                        type: 'doc',
                        name: 'Overview Document',
                        url: 'https://example.com/overview.pdf',
                    },
                ],
                deadlineToApply: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
                deadlineToComplete: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
                applicantCapacity: 100,
                selectionCapacity: 10,
                authorId: author.id,
            },
        });
    }
}

async function generateProjectMembers() {
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
    });

    const projects = await prisma.project.findMany();

    if (users.length === 0 || projects.length === 0) {
        console.log('No users or projects found. Skipping project member generation.');
        return;
    }

    for (const project of projects) {
        // Assign 3–6 random students per project
        const numMembers = Math.floor(Math.random() * 4) + 3; // 3 to 6 members
        const shuffledUsers = users.sort(() => 0.5 - Math.random()).slice(0, numMembers);

        for (const user of shuffledUsers) {
            try {
                await prisma.projectMember.create({
                    data: {
                        userId: user.id,
                        projectId: project.id,
                    },
                });

                const existingApp = await prisma.application.findFirst({
                    where: {
                        applicantId: user.id,
                        projectId: project.id,
                    },
                });

                if (existingApp) {
                    await prisma.application.update({
                        where: { id: existingApp.id },
                        data: { status: 'ACCEPTED' },
                    });
                } else {
                    await prisma.application.create({
                        data: {
                            applicantId: user.id,
                            projectId: project.id,
                            status: 'ACCEPTED',
                        },
                    });
                }
            } catch (e) {
                // Prevent duplicate assignments or other errors from crashing seeding
                console.warn(`Skipping duplicate/failed member for project ${project.id}: ${user.id}`);
            }
        }
    }
}

async function generateApplications() {
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
    });

    const projects = await prisma.project.findMany();

    if (users.length === 0 || projects.length === 0) {
        console.log('No users or projects found. Skipping application generation.');
        return;
    }

    const statuses: Array<'PENDING' | 'ACCEPTED' | 'REJECTED'> = ['PENDING', 'ACCEPTED', 'REJECTED'];

    for (const user of users) {
        // Each user applies to 0-2 random projects
        const numApplications = Math.floor(Math.random() * 2); // 0 to 1 application
        const shuffledProjects = projects.sort(() => 0.5 - Math.random()).slice(0, numApplications);

        for (const project of shuffledProjects) {
            try {
                await prisma.application.create({
                    data: {
                        applicantId: user.id,
                        projectId: project.id,
                    },
                });
            } catch (e) {
                console.log(e);
            }
        }
    }
}

async function generateMessages() {
    const projects = await prisma.project.findMany();
    if (projects.length === 0) {
        console.log('No projects found. Skipping message generation.');
        return;
    }
    const students = await prisma.user.findMany({
        where: { role: 'USER' },
    });
    for (const project of projects) {
        // Create a welcome message from the project author
        const author = await prisma.user.findUnique({
            where: { id: project.authorId },
        });
        if (author) {
            await prisma.message.create({
                data: {
                    senderId: author.id,
                    projectId: project.id,
                    content: `Welcome to ${project.title}! Looking forward to a great collaboration.`,
                },
            });
        }
        // Create a reply message from a random student (if available)
        if (students.length > 0) {
            const randomStudent = students[Math.floor(Math.random() * students.length)];
            await prisma.message.create({
                data: {
                    senderId: randomStudent.id,
                    projectId: project.id,
                    content: `Excited to join ${project.title}!`,
                },
            });
        }
    }
}

async function goThrough() {
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
    });

    const projects = await prisma.project.findMany();

    // Ensure an ACCEPTED application exists

    for (const user of users) {
        for (const project of projects) {
            const existingApp = await prisma.application.findFirst({
                where: {
                    applicantId: user.id,
                    projectId: project.id,
                },
            });

            if (existingApp) {
                await prisma.application.update({
                    where: { id: existingApp.id },
                    data: { status: 'ACCEPTED' },
                });
            } else {
                await prisma.application.create({
                    data: {
                        applicantId: user.id,
                        projectId: project.id,
                        status: 'ACCEPTED',
                    },
                });
            }
        }
    }
}

async function main() {
    // await add_students()
    //     .then(() => console.log('Students seeded successfully!'))
    //     .catch((e) => console.error(e));
    // await seedProfessors()
    //     .then(() => console.log('Professors seeded successfully!'))
    //     .catch((e) => console.error(e));
    // await seedAdmins()
    //     .then(() => console.log('Admins seeded successfully!'))
    //     .catch((e) => console.error(e));

    // await generateProjects()
    //     .then(() => console.log('Projects seeded successfully!'))
    //     .catch((e) => console.error(e));
    // await generateApplications()
    //     .then(() => console.log('Applications seeded successfully!'))
    //     .catch((e) => console.error(e));

    // await generateProjectMembers()
    //     .then(() => console.log('Project members seeded successfully!'))
    //     .catch((e) => console.error(e));

    // await generateMessages()
    //     .then(() => console.log('Messages seeded successfully!'))
    //     .catch((e) => console.error(e));

    // await goThrough()
    //     .then(() => console.log('Applications goThrough seeded successfully!'))
    //     .catch((e) => console.error(e));

    const projectName = 'Testing for author';
    const Arpit = '0ce2d31f-8217-4a6e-89a9-126455571344';
    const utsav = 'ffd0210e-92c9-47af-a04e-71be10bece84';
    const userId = utsav;
    const professorId1 = '249819c8-aa86-4387-91ac-64ed9994a0e7';
    const mayank = '9e0a668f-4664-4ac3-abfb-e7781bd57785';
    const professorId = mayank;

    await prisma.project.create({
        data: {
            title: projectName,
            authorId: professorId,
            subheading: `Subheading for ${projectName}`,
            description: `This is a sample description for ${projectName}.`,
            difficultyTag: 'BEGINNER',
            requirementTags: ['AI', 'ML'],
            projectResources: [
                {
                    type: 'link',
                    name: 'GitHub Repo',
                    url: 'https://github.com/example/project',
                },
                {
                    type: 'doc',
                    name: 'Overview Document',
                    url: 'https://example.com/overview.pdf',
                },
            ],
            deadlineToApply: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
            deadlineToComplete: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
        },
    });

    // let projectId = '';

    // await prisma.project
    //     .findFirst({
    //         where: { title: projectName },
    //     })
    //     .then((project) => {
    //         if (project) {
    //             projectId = project.id;
    //         } else {
    //             throw new Error(`Project with title ${projectName} not found`);
    //         }
    //     });

    // await prisma.projectMember.create({
    //     data: {
    //         userId: userId,
    //         projectId: projectId,
    //     },
    // });

    // const existingApp = await prisma.application.findFirst({
    //     where: {
    //         applicantId: userId,
    //         projectId: projectId,
    //     },
    // });

    // if (existingApp) {
    //     await prisma.application.update({
    //         where: { id: existingApp.id },
    //         data: { status: 'ACCEPTED' },
    //     });
    // } else {
    //     await prisma.application.create({
    //         data: {
    //             applicantId: userId,
    //             projectId: projectId,
    //             status: 'ACCEPTED',
    //         },
    //     });
    // }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
