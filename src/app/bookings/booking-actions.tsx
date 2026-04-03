"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import type { AppointmentStatus } from "@prisma/client";

export function BookingActions({
  appointmentId,
  status,
  startAt,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  startAt: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canCancel = status === "PENDING" || status === "CONFIRMED";
  const start = parseISO(startAt);
  const canCheckIn =
    (status === "CONFIRMED" || status === "PENDING") && isToday(start);

  async function patch(action: "cancel" | "check_in") {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {canCheckIn && (
        <Button size="sm" onClick={() => patch("check_in")} disabled={loading}>
          I have arrived — check in
        </Button>
      )}
      {canCancel && (
        <Button size="sm" variant="outline" onClick={() => patch("cancel")} disabled={loading}>
          Cancel booking
        </Button>
      )}
    </div>
  );
}
