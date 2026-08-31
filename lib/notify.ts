/**
 * Notification routing. Email only — this application never sends SMS.
 *
 * When a visitor picks "Text me", that is a preference recorded at the top of
 * the email. Kim reads it and texts them back herself, from her own phone, as a
 * normal person-to-person message. No Twilio, no carrier registration, no
 * per-message cost, no compliance surface.
 */

import { appendFile } from "node:fs/promises";
import path from "node:path";
import { site } from "@/content/site";
import {
  describeDay,
  describeSlotShort,
  describeTimes,
  flexibleNote,
} from "./hours";
import { formatPhone } from "./validate";
import type { ContactPayload } from "./types";

export type Mail = {
  to: string;
  subject: string;
  body: string;
  replyTo: string | null;
};

const LABEL_WIDTH = 12;
/** The receipt's block is indented, so it uses a narrower column. */
const RECEIPT_LABEL_WIDTH = 9;

function row(label: string, value: string, width = LABEL_WIDTH): string {
  // padEnd is a no-op once the label is longer than the column, which would
  // run the label straight into the value. Always keep at least one space.
  const key = `${label}:`;
  return `${key.padEnd(width)}${key.length >= width ? " " : ""}${value}`;
}

/**
 * The whole point of the subject prefix is that Kim — or a Gmail filter — can
 * sort bookings from questions at a glance without opening anything.
 */
export function buildEmail(p: ContactPayload): Mail {
  const name = p.name.trim();
  const byText = p.replyChannel === "text";

  // One channel, shown prominently, and not repeated further down.
  const firstLine = byText
    ? `TEXT HER AT ${formatPhone(p.phone)}`
    : `EMAIL HER AT ${p.email.trim()}`;

  // Reply-to only works if we actually have an email address for them.
  const replyTo = isUsableEmail(p.email) ? p.email.trim() : null;

  if (p.formType === "appointment") {
    const subject = `[BOOKING] ${name} — ${describeSlotShort(p.primary)} — reply by ${
      byText ? "Text" : "Email"
    }`;

    // Day and times on separate rows: Kim reads the day, then scans the list
    // against her book. The times line is the one she acts on.
    const flexible = flexibleNote(p.primary);
    const lines = [
      flexible ? row("Requested", flexible) : row("Day", describeDay(p.primary)),
      flexible
        ? null
        : row(p.primary.slots.length === 1 ? "Time" : "Times", describeTimes(p.primary)),
      row("Service", p.service.trim() || "Not sure yet"),
      row("Name", name),
      p.notes.trim() ? row("Notes", p.notes.trim()) : null,
    ].filter((line): line is string => line !== null);

    return {
      to: requireEnv("NOTIFY_BOOKING_EMAIL"),
      subject,
      replyTo,
      body: `${firstLine}\n\n${lines.join("\n")}\n`,
    };
  }

  return {
    to: requireEnv("NOTIFY_QUESTIONS_EMAIL"),
    subject: `[QUESTION] ${name}`,
    replyTo,
    body: `${firstLine}\n\n${row("Name", name)}\n\nQuestion:\n${p.question.trim()}\n`,
  };
}

function isUsableEmail(value: string): boolean {
  return value.trim().length > 0 && value.includes("@");
}

/**
 * In stub mode there is no inbox, so an unset address is fine — it just shows up
 * in the console log as "(not configured)".
 */
function requireEnv(key: string): string {
  return process.env[key]?.trim() || "(not configured)";
}

/**
 * The receipt the visitor gets, so they have something in writing and aren't
 * left wondering whether the form worked. Only possible when they chose to be
 * emailed back — if they asked Kim to text them, we never collected an address,
 * and the site does not send SMS.
 *
 * Replies land in Kim's inbox, not a no-reply void.
 */
export function buildVisitorReceipt(p: ContactPayload): Mail | null {
  const to = p.email.trim();
  if (!isUsableEmail(to)) return null;

  const name = p.name.trim();
  const where = `${site.name}\n${site.address.street}, ${site.address.place}\n${site.address.city}, ${site.address.state} ${site.address.zip}\n${site.phone}`;

  if (p.formType === "appointment") {
    const indent = (label: string, value: string) =>
      `  ${row(label, value, RECEIPT_LABEL_WIDTH)}`;

    const flexible = flexibleNote(p.primary);
    const what = flexible
      ? indent("Requested", flexible)
      : [
          indent("Day", describeDay(p.primary)),
          indent(
            p.primary.slots.length === 1 ? "Time" : "Times",
            describeTimes(p.primary),
          ),
        ].join("\n");

    return {
      to,
      subject: `We got your request — ${site.name}`,
      replyTo: requireEnvOrNull("NOTIFY_BOOKING_EMAIL"),
      body: [
        `Hi ${name},`,
        "",
        `Thanks — Kim has your appointment request.`,
        "",
        `Nothing is booked yet. Kim keeps her appointment book by hand, so she'll`,
        `check it and write back within ${site.booking.replyWindow} to confirm a time.`,
        "",
        `Here's what you sent:`,
        "",
        what,
        p.service.trim() ? indent("Service", p.service.trim()) : null,
        "",
        `If you need her sooner, just call ${site.phone}.`,
        "",
        "—",
        where,
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    };
  }

  return {
    to,
    subject: `We got your message — ${site.name}`,
    replyTo: requireEnvOrNull("NOTIFY_QUESTIONS_EMAIL"),
    body: [
      `Hi ${name},`,
      "",
      `Thanks — Kim has your question and usually replies within a day or two.`,
      "",
      `You asked:`,
      "",
      p.question.trim(),
      "",
      `If you need an answer sooner, just call ${site.phone}.`,
      "",
      "—",
      where,
    ].join("\n"),
  };
}

function requireEnvOrNull(key: string): string | null {
  return process.env[key]?.trim() || null;
}

export type DeliveryMode = "stub" | "sent";

/** Kim's notification. Recorded to the log, and a failure fails the request. */
export async function deliver(mail: Mail, payload: ContactPayload) {
  await recordSubmission(mail, payload);
  return sendMail(mail, "email to Kim", true);
}

/**
 * The visitor's receipt. Best-effort on purpose: Kim already has the request,
 * so a failure here must never turn a successful booking into an error the
 * visitor sees. It's logged and swallowed.
 */
export async function deliverReceipt(mail: Mail | null) {
  if (!mail) return;
  try {
    // Not recorded: .submissions.log is Kim's record of what came in, and a
    // receipt is a copy of what she already has.
    await sendMail(mail, "receipt to the visitor", false);
  } catch (error) {
    console.error("[hair-seven] visitor receipt failed to send:", error);
  }
}

async function sendMail(mail: Mail, label: string, recorded: boolean) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    printStub(mail, label, recorded);
    return "stub" as DeliveryMode;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM?.trim(),
      to: [mail.to],
      subject: mail.subject,
      text: mail.body,
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Resend returned ${response.status}: ${detail.slice(0, 500)}`,
    );
  }

  return "sent" as DeliveryMode;
}

/**
 * Every submission is appended to .submissions.log regardless of mode, so the
 * whole flow can be demoed on a laptop with no accounts and no spend.
 * The file is gitignored.
 */
async function recordSubmission(mail: Mail, payload: ContactPayload) {
  const entry = {
    receivedAt: new Date().toISOString(),
    formType: payload.formType,
    to: mail.to,
    subject: mail.subject,
    replyTo: mail.replyTo,
    replyChannel: payload.replyChannel,
    name: payload.name.trim(),
    phone: payload.phone.trim() || null,
    email: payload.email.trim() || null,
    service: payload.service.trim() || null,
    primary: payload.primary,
    notes: payload.notes.trim() || null,
    question: payload.question.trim() || null,
  };

  try {
    await appendFile(
      path.join(process.cwd(), ".submissions.log"),
      `${JSON.stringify(entry)}\n`,
      "utf8",
    );
  } catch (error) {
    // A logging failure must never cost Kim an appointment.
    console.error("[hair-seven] could not write .submissions.log:", error);
  }
}

function printStub(mail: Mail, label: string, recorded: boolean) {
  const rule = "─".repeat(64);
  console.log(
    [
      "",
      rule,
      `  ${site.name.toUpperCase()} — STUB MODE (RESEND_API_KEY is not set)`,
      `  Nothing was emailed. This is the ${label} that would have gone out.`,
      rule,
      row("To", mail.to),
      row("Subject", mail.subject),
      row("Reply-To", mail.replyTo ?? "(none)"),
      rule,
      mail.body.trimEnd(),
      rule,
      recorded
        ? "  Also appended to .submissions.log"
        : "  Not logged — .submissions.log records what came in, not replies.",
      rule,
      "",
    ].join("\n"),
  );
}
