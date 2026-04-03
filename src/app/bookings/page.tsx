import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login?callbackUrl=/bookings");
  }

  const appointments = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    orderBy: { startAt: "asc" },
    include: { doctor: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My bookings</h1>
        <p className="text-muted-foreground">Check in when you arrive at the clinic.</p>
      </div>
      <div className="space-y-4">
        {appointments.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{a.doctor.name}</CardTitle>
                <CardDescription>{a.doctor.specialty}</CardDescription>
              </div>
              <Badge
                variant={
                  a.status === "CANCELLED"
                    ? "outline"
                    : a.status === "CHECKED_IN" || a.status === "COMPLETED"
                      ? "success"
                      : "default"
                }
              >
                {a.status.replace("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                {format(a.startAt, "PPP p")} – {format(a.endAt, "p")}
              </p>
              {a.reason && <p className="text-sm text-muted-foreground">Note: {a.reason}</p>}
              <BookingActions
                appointmentId={a.id}
                status={a.status}
                startAt={a.startAt.toISOString()}
              />
            </CardContent>
          </Card>
        ))}
        {appointments.length === 0 && (
          <p className="text-muted-foreground">You have no appointments yet.</p>
        )}
      </div>
    </div>
  );
}
