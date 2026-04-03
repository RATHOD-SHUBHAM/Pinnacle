"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type QueueRow = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  reason: string | null;
  checkedInAt: string | null;
  doctor: { id: string; name: string; specialty: string };
  patient: { id: string; name: string | null; email: string; phone: string | null };
};

type DoctorRow = {
  id: string;
  name: string;
  specialty: string;
  email: string | null;
  bio: string | null;
  isActive: boolean;
  scheduleBlocks: {
    id: string;
    weekday: number;
    startMinutes: number;
    endMinutes: number;
    slotMinutes: number;
  }[];
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtMin(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function AdminDashboard() {
  const { data: session, status } = useSession();
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingD, setLoadingD] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoadingQ(true);
    const res = await fetch(`/api/admin/queue?date=${encodeURIComponent(date)}`);
    setLoadingQ(false);
    if (res.ok) setQueue(await res.json());
  }, [date]);

  const loadDoctors = useCallback(async () => {
    setLoadingD(true);
    const res = await fetch("/api/admin/doctors");
    setLoadingD(false);
    if (res.ok) setDoctors(await res.json());
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  async function patchAppt(id: string, action: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void loadQueue();
  }

  async function addDoctor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const specialty = String(fd.get("specialty") ?? "");
    const res = await fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, specialty }),
    });
    if (res.ok) {
      e.currentTarget.reset();
      void loadDoctors();
    }
  }

  async function addBlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const doctorId = String(fd.get("doctorId") ?? "");
    const weekday = Number(fd.get("weekday"));
    const start = String(fd.get("start") ?? "09:00");
    const end = String(fd.get("end") ?? "17:00");
    const slotMinutes = Number(fd.get("slotMinutes") ?? 30);
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const res = await fetch(`/api/admin/doctors/${doctorId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekday, startMinutes, endMinutes, slotMinutes }),
    });
    if (res.ok) void loadDoctors();
  }

  async function deleteBlock(blockId: string) {
    await fetch(`/api/admin/schedule/${blockId}`, { method: "DELETE" });
    void loadDoctors();
  }

  if (status === "loading") {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (session?.user.role !== "ADMIN" && session?.user.role !== "STAFF") {
    return <p className="text-destructive">Access denied.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Daily queue and doctor schedules.</p>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Today&apos;s queue</TabsTrigger>
          <TabsTrigger value="doctors">Doctors &amp; schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Filter by clinic date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qdate">Date</Label>
                  <Input
                    id="qdate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <Button type="button" variant="secondary" onClick={() => void loadQueue()}>
                  Refresh
                </Button>
              </div>
              {loadingQ ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queue.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(row.startAt), "HH:mm")} –{" "}
                          {format(new Date(row.endAt), "HH:mm")}
                        </TableCell>
                        <TableCell>{row.doctor.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{row.patient.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{row.patient.email}</div>
                          {row.patient.phone && (
                            <div className="text-xs text-muted-foreground">{row.patient.phone}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {(row.status === "CONFIRMED" || row.status === "PENDING") && (
                              <Button size="sm" variant="outline" onClick={() => patchAppt(row.id, "check_in")}>
                                Check in
                              </Button>
                            )}
                            {row.status === "CHECKED_IN" && (
                              <Button size="sm" onClick={() => patchAppt(row.id, "complete")}>
                                Complete
                              </Button>
                            )}
                            {(row.status === "CONFIRMED" ||
                              row.status === "CHECKED_IN" ||
                              row.status === "PENDING") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => patchAppt(row.id, "no_show")}
                              >
                                No-show
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loadingQ && queue.length === 0 && (
                <p className="text-sm text-muted-foreground">No appointments this day.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDoctor} className="flex flex-wrap gap-4">
                <Input name="name" placeholder="Name" required className="max-w-xs" />
                <Input name="specialty" placeholder="Specialty" required className="max-w-xs" />
                <Button type="submit">Add</Button>
              </form>
            </CardContent>
          </Card>

          {loadingD ? (
            <p className="text-sm text-muted-foreground">Loading doctors…</p>
          ) : (
            doctors.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{doc.name}</CardTitle>
                    <Badge>{doc.specialty}</Badge>
                  </div>
                  <CardDescription>{doc.bio ?? "—"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">Weekly blocks</p>
                    <ul className="space-y-1 text-sm">
                      {doc.scheduleBlocks.map((b) => (
                        <li key={b.id} className="flex flex-wrap items-center gap-2">
                          <span>
                            {weekdays[b.weekday]} {fmtMin(b.startMinutes)}–{fmtMin(b.endMinutes)} (
                            {b.slotMinutes} min)
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => deleteBlock(b.id)}>
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                    {doc.scheduleBlocks.length === 0 && (
                      <p className="text-sm text-muted-foreground">No blocks yet.</p>
                    )}
                  </div>
                  <form onSubmit={addBlock} className="flex flex-wrap items-end gap-2 border-t pt-4">
                    <input type="hidden" name="doctorId" value={doc.id} />
                    <div className="space-y-1">
                      <Label className="text-xs">Weekday</Label>
                      <select
                        name="weekday"
                        defaultValue="1"
                        className="flex h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {weekdays.map((w, i) => (
                          <option key={w} value={i}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Start</Label>
                      <Input name="start" type="time" defaultValue="09:00" className="w-[120px]" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End</Label>
                      <Input name="end" type="time" defaultValue="17:00" className="w-[120px]" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Slot (min)</Label>
                      <Input
                        name="slotMinutes"
                        type="number"
                        defaultValue={30}
                        min={5}
                        className="w-[90px]"
                      />
                    </div>
                    <Button type="submit">Add block</Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
