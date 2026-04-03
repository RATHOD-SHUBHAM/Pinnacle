import { addMinutes, endOfDay, isBefore, isSameDay, setHours, setMinutes, startOfDay } from "date-fns";

export type Slot = { start: Date; end: Date };

export type ScheduleBlockInput = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  slotMinutes: number;
};

/**
 * Generate available slots for `date` from weekly schedule blocks.
 * `booked` are intervals already taken for the same doctor.
 */
export function computeAvailableSlots(
  date: Date,
  blocks: ScheduleBlockInput[],
  booked: { start: Date; end: Date }[],
  now: Date = new Date(),
): Slot[] {
  if (isBefore(endOfDay(date), now)) return [];

  const weekday = date.getDay();
  const dayStart = startOfDay(date);
  const slots: Slot[] = [];

  for (const block of blocks) {
    if (block.weekday !== weekday) continue;

    let cursor = minutesToDate(dayStart, block.startMinutes);
    const blockEnd = minutesToDate(dayStart, block.endMinutes);

    while (cursor < blockEnd) {
      const end = addMinutes(cursor, block.slotMinutes);
      if (end > blockEnd) break;

      const slot = { start: cursor, end };
      const overlapsBooked = booked.some(
        (b) => b.start < slot.end && b.end > slot.start,
      );
      const tooSoon = isSameDay(date, now) && !isBefore(now, slot.start);

      if (!overlapsBooked && !tooSoon) {
        slots.push(slot);
      }

      cursor = end;
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function minutesToDate(dayStart: Date, minutesFromMidnight: number): Date {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return setMinutes(setHours(dayStart, h), m);
}

export function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start < b.end && a.end > b.start;
}

export { startOfDay, endOfDay };
