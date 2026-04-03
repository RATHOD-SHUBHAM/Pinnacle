import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requirePatient();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    orderBy: { startAt: "asc" },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return NextResponse.json(
    list.map((a) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
      reason: a.reason,
      checkedInAt: a.checkedInAt?.toISOString() ?? null,
      doctor: a.doctor,
    })),
  );
}
