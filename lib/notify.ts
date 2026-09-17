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
  return sendSms(sms);
}

async function sendSms(sms: Sms): Promise<DeliveryMode> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  // Kim's number can be known before Twilio is. Missing credentials stay in
  // stub mode; a half-filled Twilio config is a real misconfiguration.
  if (!accountSid && !authToken && !from) {
    printStub(sms);
    return "stub";
  }
  if (!accountSid || !authToken || !from || !sms.to) {
    throw new Error("Twilio SMS configuration is incomplete.");
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      accountSid,
    )}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64",
        )}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ To: sms.to, From: from, Body: sms.body }),
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
    console.error("[hair-seven] could not write .submissions.log:", error);
  }
}

function printStub(sms: Sms) {
  const length = sms.body.length;
  const segments = smsSegmentCount(length);
  const rule = "─".repeat(64);
  console.log(
    [
      "",
      rule,
      "  HAIR 7 — STUB MODE (Twilio is not configured)",
      "  SMS preview only. Nothing was texted or emailed.",
      "  This is the text Kim would have received.",
      rule,
      row("To", sms.to || "(not configured)"),
      row(
        "Length",
        `${length} characters (${segments} ${segments === 1 ? "text" : "texts"}; ${SMS_SEGMENT_LENGTH} is one text)`,
      ),
      rule,
      sms.body,
      rule,
      "  Also appended to .submissions.log",
      rule,
      "",
    ].join("\n"),
  );
}
