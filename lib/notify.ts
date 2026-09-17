/**
 * SMS notification routing.
 *
 * A submission texts Kim the request details through Twilio. Her reply to the
 * visitor is always a normal call or person-to-person text from her own phone.
 */

import { appendFile } from "node:fs/promises";
import path from "node:path";
import { site } from "@/content/site";
import { describeDay, describeTimes } from "./hours";
import type { ContactPayload } from "./types";
import { formatPhone } from "./validate";

export type Sms = {
  to: string;
  body: string;
};

function row(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function buildSms(payload: ContactPayload): Sms {
  const name = payload.name.trim();
  const reply = `${payload.replyChannel === "call" ? "CALL" : "TEXT"} ${formatPhone(
    payload.phone,
  )}`;

  if (payload.formType === "appointment") {
    return {
      to: notifyDestination(),
      body: [
        "HAIR 7 BOOKING REQUEST",
        row("Name", name),
        row("Reply", reply),
        row("Day", describeDay(payload.primary)),
        row("Windows", describeTimes(payload.primary)),
        row("Service", payload.service.trim() || "Not sure yet"),
        payload.notes.trim() ? row("Notes", payload.notes.trim()) : null,
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    };
  }

  return {
    to: notifyDestination(),
    body: [
      "HAIR 7 QUESTION",
      row("Name", name),
      row("Reply", reply),
      "",
      payload.question.trim(),
    ].join("\n"),
  };
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

function env(key: string): string {
  return process.env[key]?.trim() || "";
}

/** Kim's salon number unless NOTIFY_MOBILE_NUMBER is set. */
function notifyDestination(): string {
  return env("NOTIFY_MOBILE_NUMBER") || site.phoneHref;
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
  const rule = "─".repeat(64);
  console.log(
    [
      "",
      rule,
      "  HAIR 7 — STUB MODE (Twilio is not configured)",
      "  Nothing was texted. This is the SMS Kim would have received.",
      rule,
      row("To", sms.to || "(not configured)"),
      rule,
      sms.body,
      rule,
      "  Also appended to .submissions.log",
      rule,
      "",
    ].join("\n"),
  );
}
