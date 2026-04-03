import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Our doctors</h1>
        <p className="text-muted-foreground">Choose a clinician and book an available slot.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {doctors.map((d) => (
          <Link key={d.id} href={`/doctors/${d.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">{d.name}</CardTitle>
                  <Badge variant="secondary">{d.specialty}</Badge>
                </div>
                {d.bio && <CardDescription className="line-clamp-3">{d.bio}</CardDescription>}
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary">View availability →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {doctors.length === 0 && (
        <p className="text-muted-foreground">No doctors listed yet. Ask staff to add profiles.</p>
      )}
    </div>
  );
}
