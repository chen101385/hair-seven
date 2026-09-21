import { NextResponse } from "next/server";
import { site } from "@/content/site";
import {
  getBookingRequest,
  saveBookingRequest,
  withBookingLock,
  type AlternativeWindow,
} from "@/lib/booking-requests";
import {
  formatTime12,
  generateAvailabilityWindows,
  getAvailableDays,
  weekdayIndex,
} from "@/lib/hours";
import { deliverCustomerSms } from "@/lib/notify";
import {
  buildCustomerAlternativesSms,
  buildCustomerConfirmationSms,
} from "@/lib/sms";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("Please try that again.");
  }

  try {
    return await withBookingLock(token, async () => {
      const record = await getBookingRequest(token);
      if (!record) return fail("This request has expired.", 404);
      if (record.status === "completed") {
        return fail("This request has already been handled.", 409);
      }

      const body = asObject(raw);
      if (body.action === "confirm") {
        const time = typeof body.time === "string" ? body.time : "";
        if (!isRequestedTime(record.payload.primary.date, record.payload.primary.slots, time)) {
          return fail("Please choose one of the available times.");
        }
        await deliverCustomerSms(
          buildCustomerConfirmationSms(record.payload, time),
        );
        record.status = "completed";
        record.decision = {
          kind: "confirmed",
          time: formatTime12(parseTime(time)),
          sentAt: new Date().toISOString(),
        };
        await saveBookingRequest(record);
        return NextResponse.json({
          ok: true,
          message: `Confirmed for ${record.decision.time}.`,
        });
      }

      if (body.action === "alternatives") {
        const options = normalizeAlternatives(body.options);
        if (options.length === 0 || !alternativesAreOffered(options)) {
          return fail("Please choose one to three available alternatives.");
        }
        await deliverCustomerSms(
          buildCustomerAlternativesSms(record.payload, options),
        );
        record.status = "completed";
        record.decision = {
          kind: "alternatives",
          options,
          sentAt: new Date().toISOString(),
        };
        await saveBookingRequest(record);
        return NextResponse.json({
          ok: true,
          message: "Alternative times were sent.",
        });
      }

      return fail("Please choose Yes or suggest another time.");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_BUSY") {
      return fail("That request is already being updated. Please wait a moment.", 409);
    }
    console.error("[hair-seven] Kim response failed:", error);
    return fail("That did not send. Please try again.", 502);
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeAlternatives(value: unknown): AlternativeWindow[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, AlternativeWindow>();
  for (const item of value.slice(0, 3)) {
    const option = asObject(item);
    const date = typeof option.date === "string" ? option.date.slice(0, 10) : "";
    const start =
      typeof option.start === "number" && Number.isFinite(option.start)
        ? option.start
        : -1;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && start >= 0) {
      unique.set(`${date}:${start}`, { date, start });
    }
  }
  return Array.from(unique.values());
}

function alternativesAreOffered(options: AlternativeWindow[]): boolean {
  const offered = new Set(
    getAvailableDays().flatMap((day) =>
      day.slots.map((slot) => `${day.date}:${slot.start}`),
    ),
  );
  return options.every((option) =>
    offered.has(`${option.date}:${option.start}`),
  );
}

function isRequestedTime(
  date: string | null,
  selectedStarts: number[],
  time: string,
): boolean {
  if (!date || !/^\d{2}:\d{2}$/.test(time)) return false;
  const minutes = parseTime(time);
  const hours = site.hours[weekdayIndex(date)];
  if (!hours?.open || !hours.close) return false;
  return generateAvailabilityWindows(hours.open, hours.close).some(
    (window) =>
      selectedStarts.includes(window.start) &&
      minutes >= window.start &&
      minutes < window.end,
  );
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}
