import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookAppointment, ScheduleLegend } from "./book-appointment";

export const dynamic = "force-dynamic";

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctor = await prisma.doctor.findFirst({
    where: { id, isActive: true },
    include: { scheduleBlocks: { orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }] } },
  });
  if (!doctor) notFound();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{doctor.name}</h1>
          <Badge variant="secondary">{doctor.specialty}</Badge>
        </div>
        {doctor.bio && <p className="mt-2 max-w-2xl text-muted-foreground">{doctor.bio}</p>}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Typical weekly hours</CardTitle>
            <CardDescription>Exact slots depend on what is already booked.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleLegend blocks={doctor.scheduleBlocks} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Book an appointment</CardTitle>
            <CardDescription>Select a date and time.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookAppointment doctorId={doctor.id} doctorName={doctor.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
