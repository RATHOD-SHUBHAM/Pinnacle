import { endOfDay, startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const ok = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(dateStr);
  if (!ok.success) {
    return NextResponse.json({ error: "Use date=YYYY-MM-DD" }, { status: 400 });
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  const from = startOfDay(day);
  const to = endOfDay(day);

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: { gte: from, lte: to },
      status: { not: "CANCELLED" },
    },
    orderBy: [{ startAt: "asc" }],
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
      patient: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  return NextResponse.json(
    appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
      reason: a.reason,
      checkedInAt: a.checkedInAt?.toISOString() ?? null,
      doctor: a.doctor,
      patient: a.patient,
    })),
  );
}
