import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { getAvailableDays } from "@/lib/hours";
import {
  bookingResponseUrl,
  createBookingRequest,
} from "@/lib/booking-requests";
import { buildSms, deliver } from "@/lib/notify";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import {
  emptyPicker,
  MAX_NOTES_LENGTH,
  MAX_QUESTION_LENGTH,
} from "@/lib/types";
import type { ContactPayload, ContactResponse, PickerValue } from "@/lib/types";
import { validateContact } from "@/lib/validate";

/** node runtime: SMS delivery (or stub print) and .submissions.log. */
export const runtime = "nodejs";

/** Minimum time on page, in ms. A human cannot fill this form in three seconds. */
const MIN_ELAPSED_MS = 3_000;

const MAX_LENGTHS: Record<string, number> = {
  name: 120,
  phone: 40,
  notes: MAX_NOTES_LENGTH,
  question: MAX_QUESTION_LENGTH,
};

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** No working day offers more than three broad availability windows. */
const MAX_SLOTS = 3;

function picker(value: unknown): PickerValue {
  if (typeof value !== "object" || value === null) return { ...emptyPicker };
  const v = value as Record<string, unknown>;
  const slots = Array.isArray(v.slots)
    ? Array.from(
        new Set(
          v.slots.filter(
            (s): s is number => typeof s === "number" && Number.isFinite(s),
          ),
        ),
      )
        .sort((a, b) => a - b)
        .slice(0, MAX_SLOTS)
    : [];

  return {
    date: typeof v.date === "string" ? v.date.slice(0, 10) : null,
    slots,
  };
}

function normalize(raw: unknown): ContactPayload {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const validServices = new Set(site.services.map((service) => service.name));
  const rawServices = Array.isArray(r.services)
    ? r.services
    : typeof r.service === "string"
      ? [r.service]
      : [];
  const services = Array.from(
    new Set(
      rawServices.filter(
        (service): service is string =>
          typeof service === "string" && validServices.has(service),
      ),
    ),
  );

  return {
    formType: r.formType === "question" ? "question" : "appointment",
    name: str(r.name, MAX_LENGTHS.name),
    replyChannel:
      r.replyChannel === "text" || r.replyChannel === "call"
        ? r.replyChannel
        : null,
    phone: str(r.phone, MAX_LENGTHS.phone),
    services,
    primary: picker(r.primary),
    notes: str(r.notes, MAX_LENGTHS.notes),
    question: str(r.question, MAX_LENGTHS.question),
    company: str(r.company, 200),
    elapsedMs: typeof r.elapsedMs === "number" ? r.elapsedMs : 0,
  };
}

/**
 * Slots the visitor picked an hour ago can go stale — the lead-time window
 * moves. Re-check every one against the same generator the picker used rather
 * than trusting whatever the browser sent.
 */
function slotsStillOffered(value: PickerValue): boolean {
  if (!value.date || value.slots.length === 0) return false;
  const day = getAvailableDays().find((d) => d.date === value.date);
  if (!day) return false;
  return value.slots.every((slot) =>
    day.slots.some((offered) => offered.start === slot),
  );
}

function fail(
  message: string,
  fieldErrors?: Record<string, string>,
  status = 400,
) {
  return NextResponse.json<ContactResponse>(
    { ok: false, message, fieldErrors },
    { status },
  );
}

export async function POST(request: Request) {
  // Before anything expensive: cap how often one client can post.
  const limit = checkRateLimit(clientKey(request));
  if (!limit.ok) {
    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        message: `You’ve already sent a few requests. Kim has them — please call ${site.phone} if you need her right away.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("Something went wrong sending that. Please try again.");
  }

  const payload = normalize(raw);

  // Spam checks. Both fail silently-ish: a bot gets a plain refusal, and a real
  // person never sees either of these because they can't trip them.
  if (payload.company.trim() !== "") {
    return fail("Something went wrong sending that. Please try again.");
  }
  if (payload.elapsedMs < MIN_ELAPSED_MS) {
    return fail("Something went wrong sending that. Please try again.");
  }

  const fieldErrors = validateContact(payload);

  if (
    payload.formType === "appointment" &&
    !fieldErrors.primary &&
    !slotsStillOffered(payload.primary)
  ) {
    fieldErrors.primary =
      payload.primary.slots.length > 1
        ? "Some of those times aren’t available anymore. Please pick again."
        : "That time isn’t available anymore. Please pick another one.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail("Please check the highlighted fields below.", fieldErrors);
  }

  try {
    const manageUrl =
      payload.formType === "appointment"
        ? bookingResponseUrl(
            request,
            (await createBookingRequest(payload)).token,
          )
        : undefined;
    await deliver(buildSms(payload, { manageUrl }), payload);
  } catch (error) {
    console.error("[hair-seven] delivery failed:", error);
    return fail(
      `Sorry — that didn't send. Please try again, or call the salon.`,
      undefined,
      502,
    );
  }

  return NextResponse.json<ContactResponse>({ ok: true });
}
