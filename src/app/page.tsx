import Link from "next/link";
import { CalendarCheck, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Care that fits your schedule
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Browse our doctors, see real-time availability, book in seconds, and check in when you
          arrive — all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/doctors">
            <Button size="lg">Find a doctor</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Create patient account
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>For patients</CardTitle>
            <CardDescription>
              Search by specialty, pick a slot, receive email confirmation, manage or cancel
              bookings, and check in on arrival.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Sign in to manage bookings →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CalendarCheck className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Live availability</CardTitle>
            <CardDescription>
              Schedules are driven by weekly blocks maintained by your clinic — no double-booking
              for the same doctor and time.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>For staff</CardTitle>
            <CardDescription>
              Admin and front-desk roles can adjust doctor schedules and watch the daily queue in
              real time.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
