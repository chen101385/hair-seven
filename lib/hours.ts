/**
 * Hours + time-slot logic.
 *
 * Everything here reads from `site.hours` in content/site.ts. The Hours section
 * and the booking picker both call into this file, so changing an hour in the
 * content file updates both. There is no second list of times anywhere.
 *
 * `site.hours` MUST stay in Sunday-first order — index 0 is Sunday, matching
 * JavaScript's getUTCDay(). Slot generation indexes into it directly.
 */

import { site } from "@/content/site";
import type { PickerValue } from "./types";

export type AvailableDay = {
  /** "2026-09-16" */
  date: string;
  /** "TUE" */
  weekdayShort: string;
  /** "Tuesday" */
  weekdayLong: string;
  /** "Sep 16" */
  dateLabel: string;
  /** "Tuesday, Sep 16" — used in confirmations and notifications */
  fullLabel: string;
  /** "10am–6pm" */
  hoursLabel: string;
  slots: AvailabilityWindow[];
};

export type AvailabilityWindow = {
  /** Minutes past midnight. The start is also the stable form value. */
  start: number;
  end: number;
  name: "Morning" | "Afternoon" | "Early afternoon" | "Early evening";
  /** "10:00 AM–12:00 PM" */
  timeLabel: string;
};

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const WEEKDAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MINUTES_PER_DAY = 1440;

/** "10:00" -> 600 */
export function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** 600 -> "10:00 AM". Always 12-hour, never "14:00". */
export function formatTime12(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** 600 -> "10am", 630 -> "10:30am". Compact form for the day cards. */
export function formatTimeCompact(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0
    ? `${h12}${suffix}`
    : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

/** "10:00 AM – 6:00 PM", or "Closed". Used by the Hours table. */
export function formatDayHours(open: string | null, close: string | null) {
  if (!open || !close) return "Closed";
  return `${formatTime12(parseHHMM(open))} – ${formatTime12(parseHHMM(close))}`;
}

/** "10am–6pm". Used on the day cards, where space is tight. */
export function formatDayHoursCompact(open: string | null, close: string | null) {
  if (!open || !close) return "Closed";
  return `${formatTimeCompact(parseHHMM(open))}–${formatTimeCompact(parseHHMM(close))}`;
}

/**
 * The current date and time in the salon's timezone, not the visitor's.
 * Someone browsing from New York shouldn't be offered a slot that already
 * passed in Mountain View, and vice versa.
 */
export function salonNow(now: Date = new Date(), timeZone: string = site.timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const year = get("year");
  const month = get("month");
  const day = get("day");

  return {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    minutes: get("hour") * 60 + get("minute"),
  };
}

/** "2026-09-16" + 3 -> "2026-09-19". UTC noon keeps DST out of the arithmetic. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12));
  t.setUTCDate(t.getUTCDate() + days);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(
    t.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** 0 = Sunday, matching the order of site.hours. */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/** "2026-09-16" -> "Sep 16" */
export function formatDateLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${MONTHS_SHORT[m - 1]} ${d}`;
}

/** "2026-09-16" -> "Tuesday, Sep 16" */
export function formatFullDateLabel(date: string): string {
  return `${WEEKDAYS_LONG[weekdayIndex(date)]}, ${formatDateLabel(date)}`;
}

/** Broad windows for when a visitor is available, not exact appointment starts. */
export function generateAvailabilityWindows(
  open: string,
  close: string,
): AvailabilityWindow[] {
  const start = parseHHMM(open);
  const end = parseHHMM(close);
  if (end - start <= 4 * 60) {
    return [
      {
        start,
        end,
        name: start < 12 * 60 ? "Morning" : "Afternoon",
        timeLabel: `${formatTime12(start)}–${formatTime12(end)}`,
      },
    ];
  }

  const boundaries = [start, 12 * 60, 15 * 60, end]
    .filter((value) => value >= start && value <= end)
    .filter((value, index, values) => index === 0 || value !== values[index - 1]);

  return boundaries.slice(0, -1).map((windowStart, index) => {
    const windowEnd = boundaries[index + 1];
    const name =
      windowStart < 12 * 60
        ? "Morning"
        : windowStart < 15 * 60
          ? "Early afternoon"
          : "Early evening";

    return {
      start: windowStart,
      end: windowEnd,
      name,
      timeLabel: `${formatTime12(windowStart)}–${formatTime12(windowEnd)}`,
    };
  });
}

/**
 * The days offered by the picker: the next `daysAhead` days, minus closed days,
 * minus blackout dates, minus days whose slots have all been eaten by the lead
 * time. Closed days are omitted entirely — never greyed out.
 */
export function getAvailableDays(now: Date = new Date()): AvailableDay[] {
  const { date: today, minutes: nowMinutes } = salonNow(now);
  const { daysAhead, leadTimeHours, blackoutDates } = site.booking;
  const earliest = nowMinutes + leadTimeHours * 60;

  const days: AvailableDay[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = addDays(today, offset);
    if (blackoutDates.includes(date)) continue;

    const dayHours = site.hours[weekdayIndex(date)];
    if (!dayHours?.open || !dayHours.close) continue;

    // Slot times are minutes-past-midnight on `date`; the lead-time threshold is
    // expressed in the same frame by subtracting the whole days in between.
    const threshold = earliest - offset * MINUTES_PER_DAY;
    const slots = generateAvailabilityWindows(dayHours.open, dayHours.close).filter(
      (slot) => slot.start >= threshold,
    );
    if (slots.length === 0) continue;

    const weekday = weekdayIndex(date);
    days.push({
      date,
      weekdayShort: WEEKDAYS_SHORT[weekday],
      weekdayLong: WEEKDAYS_LONG[weekday],
      dateLabel: formatDateLabel(date),
      fullLabel: formatFullDateLabel(date),
      hoursLabel: formatDayHoursCompact(dayHours.open, dayHours.close),
      slots,
    });
  }

  return days;
}

/** "Thursday, Sep 18". */
export function describeDay(picker: PickerValue): string {
  return picker.date ? formatFullDateLabel(picker.date) : "—";
}

/** Every broad availability window the visitor selected. */
export function describeTimes(picker: PickerValue): string {
  if (!picker.date || picker.slots.length === 0) return "—";
  const dayHours = site.hours[weekdayIndex(picker.date)];
  if (!dayHours?.open || !dayHours.close) return "—";
  const windows = generateAvailabilityWindows(dayHours.open, dayHours.close);

  return picker.slots
    .map((start) => {
      const window = windows.find((candidate) => candidate.start === start);
      return window ? `${window.name} (${window.timeLabel})` : formatTime12(start);
    })
    .join(", ");
}

/**
 * One-line form for concise confirmations and notifications.
 */
export function describeSlot(picker: PickerValue): string {
  if (!picker.date || picker.slots.length === 0) return "—";
  return `${formatFullDateLabel(picker.date)} — ${describeTimes(picker)}`;
}

/**
 * The subject-line form: short enough to read in a phone notification.
 * With several windows picked, the count is more useful than the full list.
 */
export function describeSlotShort(picker: PickerValue): string {
  if (!picker.date || picker.slots.length === 0) return "No time given";
  const day = formatFullDateLabel(picker.date);
  return picker.slots.length === 1
    ? `${day} (${describeTimes(picker)})`
    : `${day} (${picker.slots.length} windows)`;
}

/** Schema.org opening hours, derived from the same array. */
export function openingHoursSpecification() {
  return site.hours
    .filter((h) => h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: `https://schema.org/${h.day}`,
      opens: h.open as string,
      closes: h.close as string,
    }));
}
