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
  /** "Tuesday, Sep 16" — used in confirmations and the email */
  fullLabel: string;
  /** "10am–6pm" */
  hoursLabel: string;
  /** Minutes past midnight, e.g. [600, 630, ...] */
  slots: number[];
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

/**
 * Every slot a day could offer, ignoring lead time.
 * Slots run from open, every `slotMinutes`, stopping `lastSlotBufferMin`
 * before close so there is room for the appointment itself.
 *
 * 10:00–18:00 at 30 min with a 60 min buffer -> 10:00 AM through 5:00 PM.
 */
export function generateSlots(
  open: string,
  close: string,
  slotMinutes: number = site.booking.slotMinutes,
  lastSlotBufferMin: number = site.booking.lastSlotBufferMin,
): number[] {
  const start = parseHHMM(open);
  const lastStart = parseHHMM(close) - lastSlotBufferMin;
  const slots: number[] = [];
  for (let t = start; t <= lastStart; t += slotMinutes) slots.push(t);
  return slots;
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
    const slots = generateSlots(dayHours.open, dayHours.close).filter(
      (slot) => slot >= threshold,
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

/**
 * "Thursday, Sep 18 at 2:00 PM", or the visitor's own words if they're flexible.
 * Shared by the on-screen confirmation and the email, so the two always agree.
 */
export function describeSlot(picker: PickerValue): string {
  if (picker.flexible) {
    const note = picker.flexibleText.trim();
    return note ? `Flexible — ${note}` : "Flexible — no preference given";
  }
  if (!picker.date || picker.slot === null) return "—";
  return `${formatFullDateLabel(picker.date)} at ${formatTime12(picker.slot)}`;
}

/** The subject-line form: short enough to read in a phone notification. */
export function describeSlotShort(picker: PickerValue): string {
  if (picker.flexible) return "Flexible";
  if (!picker.date || picker.slot === null) return "No time given";
  return `${formatFullDateLabel(picker.date)} ${formatTime12(picker.slot)}`;
}

/** "$45–$75", "$45", or "Call for pricing." */
export function formatPrice(
  priceLow: number | null,
  priceHigh: number | null,
): string {
  if (priceLow == null || priceHigh == null) return "Call for pricing.";
  if (priceLow === priceHigh) return `$${priceLow}`;
  return `$${priceLow}–$${priceHigh}`;
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
