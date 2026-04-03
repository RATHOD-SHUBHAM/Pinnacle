import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const blockSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(24 * 60 - 1),
  endMinutes: z.number().int().min(1).max(24 * 60),
  slotMinutes: z.number().int().min(5).max(180).default(30),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: doctorId } = await params;
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const json = await req.json();
  const parsed = blockSchema.safeParse(json);
  if (!parsed.success || parsed.data.endMinutes <= parsed.data.startMinutes) {
    return NextResponse.json({ error: "Invalid schedule block" }, { status: 400 });
  }

  const block = await prisma.scheduleBlock.create({
    data: {
      doctorId,
      weekday: parsed.data.weekday,
      startMinutes: parsed.data.startMinutes,
      endMinutes: parsed.data.endMinutes,
      slotMinutes: parsed.data.slotMinutes,
    },
  });
  return NextResponse.json(block);
}
