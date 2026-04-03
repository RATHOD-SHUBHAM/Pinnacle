import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@clinic.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeAdmin123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Clinic Admin",
      role: Role.ADMIN,
      passwordHash,
    },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const d1 = await prisma.doctor.upsert({
    where: { id: "seed-doctor-1" },
    create: {
      id: "seed-doctor-1",
      name: "Dr. Sooraj Patil",
      specialty: "DM Neurologist",
      bio: "Neurology — DM (Doctorate of Medicine).",
      isActive: true,
    },
    update: {
      name: "Dr. Sooraj Patil",
      specialty: "DM Neurologist",
      bio: "Neurology — DM (Doctorate of Medicine).",
      isActive: true,
    },
  });

  await prisma.doctor.upsert({
    where: { id: "seed-doctor-2" },
    create: {
      id: "seed-doctor-2",
      name: "Dr. Smitha Sooraj",
      specialty: "DM Oncologist",
      bio: "Medical oncology — DM (Doctorate of Medicine).",
      isActive: true,
    },
    update: {
      name: "Dr. Smitha Sooraj",
      specialty: "DM Oncologist",
      bio: "Medical oncology — DM (Doctorate of Medicine).",
      isActive: true,
    },
  });

  await prisma.scheduleBlock.deleteMany({ where: { doctorId: d1.id } });

  const blocks = [1, 2, 3, 4, 5].map((weekday) => ({
    doctorId: d1.id,
    weekday,
    startMinutes: 9 * 60,
    endMinutes: 13 * 60,
    slotMinutes: 30,
  })).concat(
    [1, 2, 3, 4, 5].map((weekday) => ({
      doctorId: d1.id,
      weekday,
      startMinutes: 14 * 60,
      endMinutes: 18 * 60,
      slotMinutes: 30,
    })),
  );

  for (const b of blocks) {
    await prisma.scheduleBlock.create({ data: b });
  }

  const d2 = await prisma.doctor.findUnique({ where: { id: "seed-doctor-2" } });
  if (d2) {
    await prisma.scheduleBlock.deleteMany({ where: { doctorId: d2.id } });
    for (const weekday of [1, 2, 3, 4, 5]) {
      await prisma.scheduleBlock.create({
        data: {
          doctorId: d2.id,
          weekday,
          startMinutes: 10 * 60,
          endMinutes: 16 * 60,
          slotMinutes: 20,
        },
      });
    }
  }

  console.log("Seed done.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
