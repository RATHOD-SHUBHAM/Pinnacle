"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Slot = { start: string; end: string };

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookAppointment({
  doctorId,
  doctorName,
}: {
  doctorId: string;
  doctorName: string;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setError(null);
    setSelected(null);
    const res = await fetch(
      `/api/doctors/${doctorId}/availability?date=${encodeURIComponent(date)}`,
    );
    setLoadingSlots(false);
    if (!res.ok) {
      setSlots([]);
      setError("Could not load availability.");
      return;
    }
    const data = await res.json();
    setSlots(data.slots ?? []);
  }, [doctorId, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function book() {
    if (!selected || session?.user?.role !== "PATIENT") return;
    setBooking(true);
    setError(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        startAt: selected.start,
        endAt: selected.end,
        reason: reason || undefined,
      }),
    });
    setBooking(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Booking failed");
      void loadSlots();
      return;
    }
    router.push("/bookings");
    router.refresh();
  }

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading session…</p>;
  }

  if (session?.user?.role !== "PATIENT") {
    return (
      <Alert>
        <AlertDescription>
          <a href="/login" className="font-medium text-primary underline">
            Sign in
          </a>{" "}
          with a patient account to book {doctorName}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Available slots</p>
        {loadingSlots ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No slots on this day.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const active = selected?.start === s.start;
              return (
                <Button
                  key={s.start}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelected(s)}
                >
                  {format(new Date(s.start), "HH:mm")} – {format(new Date(s.end), "HH:mm")}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief notes for the doctor"
          rows={3}
        />
      </div>

      <Button onClick={book} disabled={!selected || booking}>
        {booking ? "Booking…" : "Confirm booking"}
      </Button>
    </div>
  );
}

export function ScheduleLegend({
  blocks,
}: {
  blocks: { weekday: number; startMinutes: number; endMinutes: number; slotMinutes: number }[];
}) {
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No weekly hours configured yet.</p>;
  }
  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };
  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      {blocks.map((b) => (
        <li key={`${b.weekday}-${b.startMinutes}`}>
          {weekdayNames[b.weekday]}: {fmt(b.startMinutes)}–{fmt(b.endMinutes)} ({b.slotMinutes} min
          slots)
        </li>
      ))}
    </ul>
  );
}
