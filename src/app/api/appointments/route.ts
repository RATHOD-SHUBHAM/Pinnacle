import { AppointmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/api-auth";
import { sendBookingConfirmation } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  doctorId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await requirePatient();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { doctorId, startAt, endAt, reason } = parsed.data;
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (end <= start) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, isActive: true } });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const conflicting = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: { notIn: [AppointmentStatus.CANCELLED] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
  });
  if (conflicting) {
    return NextResponse.json({ error: "That slot is no longer available" }, { status: 409 });
  }

  const appt = await prisma.appointment.create({
    data: {
      patientId: session.user.id,
      doctorId,
      startAt: start,
      endAt: end,
      status: AppointmentStatus.CONFIRMED,
      reason: reason ?? null,
    },
    include: { doctor: true, patient: true },
  });

  void sendBookingConfirmation({
    to: appt.patient.email,
    patientName: appt.patient.name ?? "Patient",
    doctorName: appt.doctor.name,
    specialty: appt.doctor.specialty,
    startAt: appt.startAt,
    endAt: appt.endAt,
  });

  return NextResponse.json({
    id: appt.id,
    startAt: appt.startAt.toISOString(),
    endAt: appt.endAt.toISOString(),
    status: appt.status,
  });
}
