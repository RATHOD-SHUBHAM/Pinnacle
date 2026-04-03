import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctor = await prisma.doctor.findFirst({
    where: { id, isActive: true },
    include: {
      scheduleBlocks: { orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }] },
    },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(doctor);
}
