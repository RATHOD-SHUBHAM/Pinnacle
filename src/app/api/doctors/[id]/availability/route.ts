import { endOfDay, startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const dateParse = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(dateStr);
  if (!dateParse.success) {
    return NextResponse.json({ error: "Use date=YYYY-MM-DD" }, { status: 400 });
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const doctor = await prisma.doctor.findFirst({
    where: { id, isActive: true },
    include: { scheduleBlocks: true },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: id,
      status: { notIn: ["CANCELLED"] },
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { startAt: true, endAt: true },
  });

  const booked = appointments.map((a) => ({ start: a.startAt, end: a.endAt }));

  const slots = computeAvailableSlots(
    date,
    doctor.scheduleBlocks.map((b) => ({
      weekday: b.weekday,
      startMinutes: b.startMinutes,
      endMinutes: b.endMinutes,
      slotMinutes: b.slotMinutes,
    })),
    booked,
  );

  return NextResponse.json({
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
  });
}
