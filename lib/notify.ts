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

function row(label: string, value: string): string {
  // padEnd is a no-op once the label is longer than the column, which would
  // run the label straight into the value. Always keep at least one space.
  const key = `${label}:`;
  return `${key.padEnd(LABEL_WIDTH)}${key.length >= LABEL_WIDTH ? " " : ""}${value}`;
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

export type DeliveryMode = "stub" | "sent";

export async function deliver(mail: Mail, payload: ContactPayload) {
  await recordSubmission(mail, payload);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    printStub(mail);
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

function printStub(mail: Mail) {
  const rule = "─".repeat(64);
  console.log(
    [
      "",
      rule,
      `  ${site.name.toUpperCase()} — STUB MODE (RESEND_API_KEY is not set)`,
      "  Nothing was emailed. This is what would have gone out.",
      rule,
      row("To", mail.to),
      row("Subject", mail.subject),
      row("Reply-To", mail.replyTo ?? "(none)"),
      rule,
      mail.body.trimEnd(),
      rule,
      "  Also appended to .submissions.log",
      rule,
      "",
    ].join("\n"),
  );
}
