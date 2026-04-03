import { AppointmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["cancel", "check_in", "complete", "no_show"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { doctor: true },
  });
  if (!appt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPatient = session.user.role === "PATIENT" && appt.patientId === session.user.id;
  const isStaff = session.user.role === "ADMIN" || session.user.role === "STAFF";

  if (parsed.data.action === "cancel") {
    if (!isPatient && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      isPatient &&
      appt.status !== AppointmentStatus.PENDING &&
      appt.status !== AppointmentStatus.CONFIRMED
    ) {
      return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
    }
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });
    return NextResponse.json({ id: updated.id, status: updated.status });
  }

  if (parsed.data.action === "check_in") {
    if (!isPatient && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      appt.status !== AppointmentStatus.CONFIRMED &&
      appt.status !== AppointmentStatus.PENDING
    ) {
      return NextResponse.json({ error: "Cannot check in for this status" }, { status: 400 });
    }
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });
    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      checkedInAt: updated.checkedInAt?.toISOString() ?? null,
    });
  }

  if (parsed.data.action === "complete" || parsed.data.action === "no_show") {
    if (!isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status =
      parsed.data.action === "complete" ? AppointmentStatus.COMPLETED : AppointmentStatus.NO_SHOW;
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ id: updated.id, status: updated.status });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
