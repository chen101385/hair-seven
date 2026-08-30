import { NextResponse } from "next/server";
import { getAvailableDays } from "@/lib/hours";
import { buildEmail, deliver } from "@/lib/notify";
import { emptyPicker } from "@/lib/types";
import type { ContactPayload, ContactResponse, PickerValue } from "@/lib/types";
import { validateContact } from "@/lib/validate";

/** node runtime: the stub writer appends to .submissions.log. */
export const runtime = "nodejs";

/** Minimum time on page, in ms. A human cannot fill this form in three seconds. */
const MIN_ELAPSED_MS = 3_000;

const MAX_LENGTHS: Record<string, number> = {
  name: 120,
  phone: 40,
  email: 200,
  service: 120,
  notes: 4_000,
  question: 4_000,
  flexibleText: 1_000,
};

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function picker(value: unknown): PickerValue {
  if (typeof value !== "object" || value === null) return { ...emptyPicker };
  const v = value as Record<string, unknown>;
  return {
    date: typeof v.date === "string" ? v.date.slice(0, 10) : null,
    slot: typeof v.slot === "number" && Number.isFinite(v.slot) ? v.slot : null,
    flexible: v.flexible === true,
    flexibleText: str(v.flexibleText, MAX_LENGTHS.flexibleText),
  };
}

function normalize(raw: unknown): ContactPayload {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    formType: r.formType === "question" ? "question" : "appointment",
    name: str(r.name, MAX_LENGTHS.name),
    replyChannel:
      r.replyChannel === "text" || r.replyChannel === "email"
        ? r.replyChannel
        : null,
    phone: str(r.phone, MAX_LENGTHS.phone),
    email: str(r.email, MAX_LENGTHS.email),
    service: str(r.service, MAX_LENGTHS.service),
    primary: picker(r.primary),
    backup: picker(r.backup),
    backupOpen: r.backupOpen === true,
    notes: str(r.notes, MAX_LENGTHS.notes),
    question: str(r.question, MAX_LENGTHS.question),
    company: str(r.company, 200),
    elapsedMs: typeof r.elapsedMs === "number" ? r.elapsedMs : 0,
  };
}

/**
 * A slot the visitor picked an hour ago can go stale — the lead-time window
 * moves. Re-check against the same generator the picker used rather than
 * trusting whatever the browser sent.
 */
function slotStillOffered(value: PickerValue): boolean {
  if (value.flexible) return true;
  if (!value.date || value.slot === null) return false;
  const day = getAvailableDays().find((d) => d.date === value.date);
  return Boolean(day?.slots.includes(value.slot));
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
    !slotStillOffered(payload.primary)
  ) {
    fieldErrors.primary =
      "That time isn't available anymore. Please pick another one.";
  }

  if (
    payload.formType === "appointment" &&
    payload.backupOpen &&
    (payload.backup.date || payload.backup.flexible) &&
    !slotStillOffered(payload.backup)
  ) {
    fieldErrors.backup =
      "That backup time isn't available anymore. Please pick another one.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail("Please check the highlighted fields below.", fieldErrors);
  }

  try {
    const mail = buildEmail(payload);
    await deliver(mail, payload);
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
