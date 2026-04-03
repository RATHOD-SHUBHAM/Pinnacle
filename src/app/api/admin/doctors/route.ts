import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  specialty: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctors = await prisma.doctor.findMany({
    orderBy: { name: "asc" },
    include: {
      scheduleBlocks: { orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }] },
    },
  });
  return NextResponse.json(doctors);
}

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, specialty, email, bio, photoUrl, isActive } = parsed.data;
  const doctor = await prisma.doctor.create({
    data: {
      name,
      specialty,
      email: email || null,
      bio: bio ?? null,
      photoUrl: photoUrl || null,
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json(doctor);
}
