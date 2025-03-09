import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
                // requirementTags: tags,
                requirementTags: [
                    tags[Math.floor(Math.random() * tags.length)].toString(),
                    tags[Math.floor(Math.random() * tags.length)].toString(),
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

async function main() {
    await add_students()
        .then(() => console.log('Students seeded successfully!'))
        .catch((e) => console.error(e));
    await seedProfessors()
        .then(() => console.log('Professors seeded successfully!'))
        .catch((e) => console.error(e));
    await seedAdmins()
        .then(() => console.log('Admins seeded successfully!'))
        .catch((e) => console.error(e));

    await generateProjects()
        .then(() => console.log('Projects seeded successfully!'))
        .catch((e) => console.error(e));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
