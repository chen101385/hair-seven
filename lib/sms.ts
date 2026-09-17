/**
 * The text Kim actually receives. Kept on GSM-7 so a booking without notes
 * stays one 160-character SMS. Notes are the only field that may start a
 * second segment.
 */

import { site } from "@/content/site";
import {
  formatDateLabel,
  generateAvailabilityWindows,
  weekdayIndex,
} from "./hours";
import type { ContactPayload, PickerValue } from "./types";
import { MAX_NOTES_LENGTH } from "./types";
import { formatPhone } from "./validate";

export const SMS_SEGMENT_LENGTH = 160;
/** Concatenated GSM-7 segments use 153 characters each after the first. */
export const SMS_CONCAT_LENGTH = 153;

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

function packAppointment(name: string, payload: ContactPayload): string {
  const reply = `${payload.replyChannel === "call" ? "C" : "T"} ${toGsm7(
    formatPhone(payload.phone),
  )}`;
  const day = payload.primary.date ? formatSmsDate(payload.primary.date) : "-";
  const service = toGsm7(payload.service.trim() || "Not sure");

  return [
    "Hair7 book",
    name,
    reply,
    day,
    describeWindowsSms(payload.primary),
    service,
  ].join("\n");
}

/** Booking SMS with notes omitted — always one GSM-7 segment. */
export function appointmentSmsBase(payload: ContactPayload): string {
  let name = toGsm7(payload.name.trim());
  let body = packAppointment(name, payload);
  if (body.length <= SMS_SEGMENT_LENGTH) return body;

  const overflow = body.length - SMS_SEGMENT_LENGTH;
  name = fit(name, Math.max(1, name.length - overflow));
  body = packAppointment(name, payload);
  return body.length <= SMS_SEGMENT_LENGTH ? body : body.slice(0, SMS_SEGMENT_LENGTH);
}

export function appointmentSmsRemaining(payload: ContactPayload): {
  remaining: number;
  secondText: boolean;
} {
  const full = buildSms(payload).body.length;
  if (full <= SMS_SEGMENT_LENGTH) {
    return { remaining: SMS_SEGMENT_LENGTH - full, secondText: false };
  }
  return {
    remaining: Math.max(0, MAX_NOTES_LENGTH - payload.notes.length),
    secondText: true,
  };
}

export function buildSms(payload: ContactPayload): Sms {
  if (payload.formType === "appointment") {
    const base = appointmentSmsBase(payload);
    const notes = toGsm7(payload.notes);
    return {
      to: notifyDestination(),
      body: notes ? `${base}\n${notes}` : base,
    };
  }

  const reply = `${payload.replyChannel === "call" ? "C" : "T"} ${toGsm7(
    formatPhone(payload.phone),
  )}`;
  return {
    to: notifyDestination(),
    body: [
      "Hair7 Q",
      toGsm7(payload.name.trim()),
      reply,
      "",
      toGsm7(payload.question),
    ].join("\n"),
  };
}
