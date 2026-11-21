import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("[Seed] Starting database seeding...");

    // Common password for demo personas
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Seed Training Centre
    const trainingCentre = await prisma.trainingCentre.upsert({
        where: { code: "TC-HYD-001" },
        update: {
            name: "Apex Skill Academy - Hyderabad",
            district: "Hyderabad",
            address: "Plot 14, Hitec City, Madhapur, Hyderabad, Telangana"
        },
        create: {
            code: "TC-HYD-001",
            name: "Apex Skill Academy - Hyderabad",
            district: "Hyderabad",
            address: "Plot 14, Hitec City, Madhapur, Hyderabad, Telangana"
        }
    });

    console.log(`[Seed] Training Centre ready: ${trainingCentre.name} (${trainingCentre.code})`);

    // 2. Demo Personas
    const demoUsers = [
        {
            email: "anika@pragati.gov.in",
            name: "Anika Sharma",
            role: Role.TRAINING_CENTRE,
            district: "Hyderabad",
            trainingCentreId: trainingCentre.id
        },
        {
            email: "dev@pragati.gov.in",
            name: "Dev Patel",
            role: Role.DISTRICT_OFFICER,
            district: "Hyderabad",
            trainingCentreId: null
        },
        {
            email: "meera@pragati.gov.in",
            name: "Meera Sen",
            role: Role.DISTRICT_OFFICER,
            district: "Hyderabad",
            trainingCentreId: null
        },
        {
            email: "kabir@pragati.gov.in",
            name: "Kabir Das",
            role: Role.DISTRICT_OFFICER,
            district: "Warangal",
            trainingCentreId: null
        },
        {
            email: "neha@pragati.gov.in",
            name: "Neha Joshi",
            role: Role.QUALITY_TEAM,
            district: null,
            trainingCentreId: null
        },
        {
            email: "farah@pragati.gov.in",
            name: "Farah Khan",
            role: Role.STATE_OFFICE,
            district: null,
            trainingCentreId: null
        }
    ];

    for (const u of demoUsers) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                role: u.role,
                district: u.district,
                passwordHash,
                trainingCentreId: u.trainingCentreId
            },
            create: {
                email: u.email,
                name: u.name,
                role: u.role,
                district: u.district,
                passwordHash,
                trainingCentreId: u.trainingCentreId
            }
        });
        console.log(`[Seed] Demo User ready: ${user.name} <${user.email}> [${user.role}]`);
    }

    console.log("[Seed] Completed successfully.");
}

main()
    .catch((e) => {
        console.error("[Seed Error]", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
