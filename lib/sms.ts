/**
 * The text Kim actually receives. Kept on GSM-7 so a booking without notes
 * stays one 160-character SMS. A booking is hard-capped at two concatenated
 * GSM-7 segments (306 characters), including notes.
 */

import { site } from "@/content/site";
import {
  formatDateLabel,
  generateAvailabilityWindows,
  weekdayIndex,
} from "./hours";
import type { ContactPayload, PickerValue } from "./types";
import { formatPhone } from "./validate";

export const SMS_SEGMENT_LENGTH = 160;
/** Concatenated GSM-7 segments use 153 characters each after the first. */
export const SMS_CONCAT_LENGTH = 153;
export const SMS_MAX_LENGTH = SMS_CONCAT_LENGTH * 2;

export type Sms = {
  to: string;
  body: string;
};

const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

const GSM7_CHARS = new Set(GSM7.split(""));

const WEEKDAYS_SMS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toGsm7(value: string): string {
  return value
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .split("")
    .map((char) => (GSM7_CHARS.has(char) ? char : " "))
    .join("")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function smsSegmentCount(length: number): number {
  if (length <= 0) return 0;
  if (length <= SMS_SEGMENT_LENGTH) return 1;
  return Math.ceil(length / SMS_CONCAT_LENGTH);
}

function notifyDestination(): string {
  return process.env.NOTIFY_MOBILE_NUMBER?.trim() || site.phoneHref;
}

function formatSmsDate(date: string): string {
  return `${WEEKDAYS_SMS[weekdayIndex(date)]} ${formatDateLabel(date)}`;
}

/** "10a-12p" — compact, ASCII, GSM-7. */
function formatSmsTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "a" : "p";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function describeWindowsSms(picker: PickerValue): string {
  if (!picker.date || picker.slots.length === 0) return "-";
  const dayHours = site.hours[weekdayIndex(picker.date)];
  if (!dayHours?.open || !dayHours.close) return "-";
  const windows = generateAvailabilityWindows(dayHours.open, dayHours.close);

  return picker.slots
    .map((start) => {
      const window = windows.find((candidate) => candidate.start === start);
      if (!window) return formatSmsTime(start);
      return `${formatSmsTime(window.start)}-${formatSmsTime(window.end)}`;
    })
    .join(", ");
}

function fit(text: string, max: number): string {
  const clean = toGsm7(text);
  if (clean.length <= max) return clean;
  if (max <= 3) return clean.slice(0, max);
  return `${clean.slice(0, max - 3)}...`;
}

const SERVICE_SMS_NAMES: Record<string, string> = {
  Haircut: "Cut",
  "Hair styling": "Style",
  "Hair coloring": "Color",
  Waxing: "Wax",
};

function describeServicesSms(services: string[]): string {
  if (services.length === 0) return "Svc ?";
  return `Svc ${services
    .map((service) => SERVICE_SMS_NAMES[service] ?? fit(service, 8))
    .join("/")}`;
}

function packAppointment(name: string, payload: ContactPayload): string {
  const reply = `${payload.replyChannel === "call" ? "C" : "T"} ${toGsm7(
    formatPhone(payload.phone),
  )}`;
  const day = payload.primary.date ? formatSmsDate(payload.primary.date) : "-";

  return [
    "Hair7 BOOK",
    name,
    reply,
    day,
    describeWindowsSms(payload.primary),
    describeServicesSms(payload.services),
  ].join("\n");
}

/** Booking SMS before notes, fitted to the requested GSM-7 character budget. */
export function appointmentSmsBase(
  payload: ContactPayload,
  maxLength: number = SMS_SEGMENT_LENGTH,
): string {
  const fullName = toGsm7(payload.name.trim()) || "?";
  let body = packAppointment(fullName, payload);
  if (body.length <= maxLength) return body;

  // Always shorten the original name with a trailing "..." — never slice the
  // packed message, which could cut a word in half with no ellipsis.
  let allowed = Math.max(4, fullName.length - (body.length - maxLength));
  let name = fit(fullName, allowed);
  body = packAppointment(name, payload);
  while (body.length > maxLength && allowed > 4) {
    allowed -= 1;
    name = fit(fullName, allowed);
    body = packAppointment(name, payload);
  }
  return body;
}

export function buildSms(payload: ContactPayload): Sms {
  if (payload.formType === "appointment") {
    const notes = toGsm7(payload.notes);
    const baseBudget = notes
      ? SMS_MAX_LENGTH - notes.length - 1
      : SMS_SEGMENT_LENGTH;
    const base = appointmentSmsBase(payload, baseBudget);
    return {
      to: notifyDestination(),
      body: (notes ? `${base}\n${notes}` : base).slice(0, SMS_MAX_LENGTH),
    };
  }

  const reply = `${payload.replyChannel === "call" ? "C" : "T"} ${toGsm7(
    formatPhone(payload.phone),
  )}`;
  const prefix = ["Hair7 Q", toGsm7(payload.name.trim()), reply].join("\n");
  const question = fit(
    payload.question,
    Math.max(0, SMS_MAX_LENGTH - prefix.length - 2),
  );
  return {
    to: notifyDestination(),
    body: `${prefix}\n\n${question}`.slice(0, SMS_MAX_LENGTH),
  };
}
