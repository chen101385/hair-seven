/**
 * SMS notification routing. Form submissions never send email.
 *
 * Live: Twilio texts Kim the request. Stub (Twilio unset): the same SMS is
 * printed to the console and logged. Kim then calls or texts the visitor
 * herself from her own phone.
 */

import { appendFile } from "node:fs/promises";
import path from "node:path";
import { buildSms, smsSegmentCount, SMS_SEGMENT_LENGTH, type Sms } from "./sms";
import type { ContactPayload } from "./types";

export type { Sms } from "./sms";
export { buildSms };

function row(label: string, value: string): string {
  return `${label}: ${value}`;
}

export type DeliveryMode = "stub" | "sent";

/** Kim's notification. Recorded locally before the SMS is attempted. */
export async function deliver(sms: Sms, payload: ContactPayload) {
  await recordSubmission(sms, payload);
  return sendSms(sms, "Kim");
}

/** Curated response to the customer; stub mode prints it for local review. */
export async function deliverCustomerSms(sms: Sms) {
  return sendSms(sms, "the customer");
}

async function sendSms(
  sms: Sms,
  recipient: "Kim" | "the customer",
): Promise<DeliveryMode> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  // Anything short of a complete Twilio config stays in stub mode and prints
  // the message. A missing credential must never cost a visitor their request
  // — it only means Kim reads it in the console instead of on her phone.
  const missing = [
    accountSid ? null : "TWILIO_ACCOUNT_SID",
    authToken ? null : "TWILIO_AUTH_TOKEN",
    from ? null : "TWILIO_FROM_NUMBER",
    sms.to ? null : "NOTIFY_MOBILE_NUMBER",
  ].filter((key): key is string => key !== null);

  if (missing.length > 0) {
    printStub(sms, missing, recipient);
    return "stub";
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      accountSid as string,
    )}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64",
        )}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        To: sms.to,
        From: from as string,
        Body: sms.body,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Twilio returned ${response.status}: ${detail.slice(0, 500)}`);
  }

  return "sent";
}

async function recordSubmission(sms: Sms, payload: ContactPayload) {
  const entry = {
    receivedAt: new Date().toISOString(),
    formType: payload.formType,
    to: sms.to || null,
    replyChannel: payload.replyChannel,
    name: payload.name.trim(),
    phone: payload.phone.trim() || null,
    services: payload.services.length > 0 ? payload.services : null,
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
    console.error("[hair-seven] could not write .submissions.log:", error);
  }
}

export function formatStub(
  sms: Sms,
  missing: string[] = [],
  recipient: "Kim" | "the customer" = "Kim",
): string {
  const length = sms.body.length;
  const segments = smsSegmentCount(length);
  const rule = "─".repeat(64);

  return [
    "",
    rule,
    "  HAIR 7 — STUB MODE. Nothing was texted or emailed.",
    `  This is the text ${recipient} would have received.`,
    missing.length > 0 ? `  Still unset: ${missing.join(", ")}` : null,
    rule,
    row("To", sms.to || "(not configured)"),
    row(
      "Length",
      `${length} characters (${segments} ${segments === 1 ? "text" : "texts"}; ${SMS_SEGMENT_LENGTH} is one text)`,
    ),
    rule,
    sms.body,
    rule,
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function printStub(
  sms: Sms,
  missing: string[],
  recipient: "Kim" | "the customer",
) {
  console.log(formatStub(sms, missing, recipient));
}
