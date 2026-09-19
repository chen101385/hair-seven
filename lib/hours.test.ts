import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import {
  addDays,
  describeDay,
  describeSlot,
  describeSlotShort,
  describeTimes,
  formatDateLabel,
  formatDayHours,
  formatDayHoursCompact,
  formatFullDateLabel,
  formatTime12,
  formatTimeCompact,
  generateAvailabilityWindows,
  getAvailableDays,
  openingHoursSpecification,
  parseHHMM,
  salonNow,
  weekdayIndex,
} from "./hours";
import type { PickerValue } from "./types";

/**
 * This is the file where a silent bug costs Kim a real appointment: a day
 * offered that she's closed, a time offered that's already passed, or an hours
 * change that reaches the Hours table but not the picker.
 *
 * The "now" values below are UTC instants; the assertions are in salon time
 * (America/Los_Angeles), which is the whole point of salonNow().
 */

const pick = (over: Partial<PickerValue> = {}): PickerValue => ({
  date: null,
  slots: [],
  ...over,
});

describe("time formatting", () => {
  it("parses HH:MM into minutes past midnight", () => {
    expect(parseHHMM("00:00")).toBe(0);
    expect(parseHHMM("10:00")).toBe(600);
    expect(parseHHMM("18:30")).toBe(1110);
  });

  it("renders 12-hour time, never 24-hour", () => {
    expect(formatTime12(0)).toBe("12:00 AM");
    expect(formatTime12(600)).toBe("10:00 AM");
    expect(formatTime12(720)).toBe("12:00 PM");
    expect(formatTime12(780)).toBe("1:00 PM");
    expect(formatTime12(1020)).toBe("5:00 PM");
    expect(formatTime12(1410)).toBe("11:30 PM");
  });

  it("renders the compact form used on day cards", () => {
    expect(formatTimeCompact(600)).toBe("10am");
    expect(formatTimeCompact(630)).toBe("10:30am");
    expect(formatTimeCompact(720)).toBe("12pm");
    expect(formatTimeCompact(0)).toBe("12am");
    expect(formatTimeCompact(1080)).toBe("6pm");
  });

  it("renders a closed day as Closed, not a blank range", () => {
    expect(formatDayHours(null, null)).toBe("Closed");
    expect(formatDayHoursCompact(null, null)).toBe("Closed");
    expect(formatDayHours("10:00", "18:00")).toBe("10:00 AM – 6:00 PM");
    expect(formatDayHoursCompact("10:00", "18:00")).toBe("10am–6pm");
  });
});

describe("date helpers", () => {
  it("adds days across month, year and leap-day boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is a leap year
    expect(addDays("2026-09-15", 0)).toBe("2026-09-15");
  });

  it("indexes weekdays Sunday-first, matching site.hours", () => {
    expect(weekdayIndex("2026-08-30")).toBe(0); // Sunday
    expect(weekdayIndex("2026-08-31")).toBe(1); // Monday
    expect(weekdayIndex("2026-09-05")).toBe(6); // Saturday
    expect(site.hours[weekdayIndex("2026-08-30")].day).toBe("Sunday");
    expect(site.hours[weekdayIndex("2026-09-05")].day).toBe("Saturday");
  });

  it("labels dates for the picker and confirmations", () => {
    expect(formatDateLabel("2026-09-03")).toBe("Sep 3");
    expect(formatFullDateLabel("2026-09-03")).toBe("Thursday, Sep 3");
  });
});

describe("salonNow", () => {
  it("reports salon-local time during daylight saving", () => {
    // 17:00 UTC in September is 10:00 in Mountain View (UTC-7).
    expect(salonNow(new Date("2026-09-01T17:00:00Z"))).toEqual({
      date: "2026-09-01",
      minutes: 600,
    });
  });

  it("reports salon-local time during standard time", () => {
    // 18:00 UTC in January is 10:00 in Mountain View (UTC-8).
    expect(salonNow(new Date("2026-01-15T18:00:00Z"))).toEqual({
      date: "2026-01-15",
      minutes: 600,
    });
  });

  it("rolls the salon date back when UTC has already ticked over", () => {
    // 03:00 UTC on the 2nd is still 20:00 on the 1st in Mountain View.
    expect(salonNow(new Date("2026-09-02T03:00:00Z"))).toEqual({
      date: "2026-09-01",
      minutes: 1200,
    });
  });
});

describe("generateAvailabilityWindows", () => {
  it("splits a 10–6 day into three broad windows", () => {
    const slots = generateAvailabilityWindows("10:00", "18:00");
    expect(slots.map(({ start, end }) => [start, end])).toEqual([
      [600, 720],
      [720, 900],
      [900, 1080],
    ]);
    expect(slots.map((slot) => slot.name)).toEqual([
      "Morning",
      "Early afternoon",
      "Early evening",
    ]);
  });

  it("shortens the final window when the salon closes earlier", () => {
    const slots = generateAvailabilityWindows("10:00", "17:00");
    expect(slots).toHaveLength(3);
    expect(slots.at(-1)).toMatchObject({ start: 900, end: 1020 });
  });

  it("offers only afternoon windows on a noon–6 Tuesday", () => {
    expect(
      generateAvailabilityWindows("12:00", "18:00").map((slot) => slot.start),
    ).toEqual([720, 900]);
  });
});

describe("getAvailableDays", () => {
  // Tuesday 1 Sep 2026, 10:00 in the salon.
  const tuesdayMorning = new Date("2026-09-01T17:00:00Z");

  it("drops today once the 12-hour lead time has eaten every slot", () => {
    const days = getAvailableDays(tuesdayMorning);
    // 10:00 + 12h lands at 22:00, past the last 17:00 slot.
    expect(days.map((d) => d.date)).not.toContain("2026-09-01");
    expect(days[0].date).toBe("2026-09-02");
    expect(days[0].slots).toHaveLength(3);
  });

  it("keeps exactly the slots that clear the lead time", () => {
    // 02:00 salon time + 12h = 14:00, so only the 3–6 window survives today.
    const days = getAvailableDays(new Date("2026-09-02T09:00:00Z"));
    expect(days[0].date).toBe("2026-09-02");
    expect(days[0].slots.map((slot) => slot.start)).toEqual([900]);
  });

  it("drops the day entirely once the last slot falls inside the lead time", () => {
    // 03:30 salon time + 12h lands after the final window starts.
    const days = getAvailableDays(new Date("2026-09-02T10:30:00Z"));
    expect(days[0].date).toBe("2026-09-03");
  });

  it("never offers a day the salon is closed", () => {
    const closed = new Set<string>(
      site.hours.filter((h) => !h.open || !h.close).map((h) => h.day),
    );
    const days = getAvailableDays(tuesdayMorning);
    for (const day of days) {
      expect(closed.has(day.weekdayLong)).toBe(false);
    }
  });

  it("carries each day's own hours through to its slots", () => {
    const days = getAvailableDays(tuesdayMorning);
    const sunday = days.find((d) => d.weekdayLong === "Sunday");
    const wednesday = days.find((d) => d.weekdayLong === "Wednesday");

    // Sunday closes at 5, the rest at 6 — the picker must reflect that.
    expect(sunday?.slots).toHaveLength(3);
    expect(sunday?.slots.at(-1)).toMatchObject({ start: 900, end: 1020 });
    expect(sunday?.hoursLabel).toBe("10am–5pm");

    expect(wednesday?.slots).toHaveLength(3);
    expect(wednesday?.slots.at(-1)).toMatchObject({ start: 900, end: 1080 });
  });

  it("stays inside the daysAhead window", () => {
    const days = getAvailableDays(tuesdayMorning);
    const last = days.at(-1)!.date;
    expect(last <= addDays("2026-09-01", site.booking.daysAhead - 1)).toBe(true);
  });

  it("removes blackout dates but leaves the weekly hours alone", () => {
    const blackout = site.booking.blackoutDates as string[];
    blackout.push("2026-09-03");
    try {
      const days = getAvailableDays(tuesdayMorning);
      expect(days.map((d) => d.date)).not.toContain("2026-09-03");
      // The following Thursday is untouched — a blackout is a one-off.
      expect(days.map((d) => d.date)).toContain("2026-09-10");
    } finally {
      blackout.length = 0;
    }
  });

  afterEach(() => {
    expect(site.booking.blackoutDates).toHaveLength(0);
  });
});

describe("describing what was requested", () => {
  it("summarises a single time", () => {
    const value = pick({ date: "2026-09-03", slots: [720] });
    expect(describeDay(value)).toBe("Thursday, Sep 3");
    expect(describeTimes(value)).toBe("Early afternoon (12:00 PM–3:00 PM)");
    expect(describeSlot(value)).toBe(
      "Thursday, Sep 3 — Early afternoon (12:00 PM–3:00 PM)",
    );
    expect(describeSlotShort(value)).toBe(
      "Thursday, Sep 3 (Early afternoon (12:00 PM–3:00 PM))",
    );
  });

  it("lists every selected window and counts them in the short form", () => {
    const value = pick({ date: "2026-09-03", slots: [600, 720, 900] });
    expect(describeTimes(value)).toBe(
      "Morning (10:00 AM–12:00 PM), Early afternoon (12:00 PM–3:00 PM), Early evening (3:00 PM–6:00 PM)",
    );
    expect(describeSlotShort(value)).toBe("Thursday, Sep 3 (3 windows)");
  });
});

describe("openingHoursSpecification", () => {
  it("publishes only the days the salon is actually open", () => {
    const spec = openingHoursSpecification();
    const openDays = site.hours.filter((h) => h.open && h.close);
    expect(spec).toHaveLength(openDays.length);
    expect(spec.every((s) => s.opens && s.closes)).toBe(true);
    expect(spec[0].dayOfWeek.startsWith("https://schema.org/")).toBe(true);
  });
});
