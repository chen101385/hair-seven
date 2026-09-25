/**
 * The text Kim actually receives. Kept on GSM-7 so a booking with its link
 * stays one 160-character SMS. A booking is hard-capped at two concatenated
 * GSM-7 segments (306 characters), including notes.
 */

import { site } from "@/content/site";
import {
  formatDateLabel,
  formatFullDateLabel,
  formatTimeCompact,
  generateAvailabilityWindows,
  weekdayIndex,
} from "./hours";
import type { AlternativeWindow } from "./booking-requests";
import type { ContactPayload, PickerValue } from "./types";
import { formatPhone, phoneToE164 } from "./validate";

export const SMS_SEGMENT_LENGTH = 160;
/** Concatenated GSM-7 segments use 153 characters each after the first. */
export const SMS_CONCAT_LENGTH = 153;
export const SMS_MAX_LENGTH = SMS_CONCAT_LENGTH * 2;

export type Sms = {
  to: string;
  body: string;
};

export type BookingSmsOptions = { manageUrl?: string };

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

/** "10am-12pm, 12pm-3pm", or "10a-12p, 12p-3p" when space is short. */
export function describeWindowsSms(
  picker: PickerValue,
  compact = false,
): string {
  if (!picker.date || picker.slots.length === 0) return "-";
  const dayHours = site.hours[weekdayIndex(picker.date)];
  if (!dayHours?.open || !dayHours.close) return "-";
  const windows = generateAvailabilityWindows(dayHours.open, dayHours.close);
  const time = compact ? formatSmsTime : formatTimeCompact;

  return picker.slots
    .map((start) => {
      const window = windows.find((candidate) => candidate.start === start);
      if (!window) return time(start);
      return `${time(window.start)}-${time(window.end)}`;
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
  Haircut: "Haircut",
  "Hair styling": "Styling",
  "Hair coloring": "Coloring",
  Waxing: "Waxing",
};

const SERVICE_SMS_SHORT: Record<string, string> = {
  Haircut: "Cut",
  "Hair styling": "Style",
  "Hair coloring": "Color",
  Waxing: "Wax",
};

function describeServicesSms(services: string[], compact = false): string {
  if (services.length === 0) return compact ? "Svc ?" : "Service not chosen";
  const names = compact ? SERVICE_SMS_SHORT : SERVICE_SMS_NAMES;
  return services
    .map((service) => names[service] ?? fit(service, compact ? 8 : 12))
    .join(", ");
}

/**
 * How far to abbreviate. 0 is the text Kim should normally get. The link line
 * is fixed at ~50 characters, so three windows and several services can push
 * past one segment; services shorten first, then times, then the name.
 */
type Density = 0 | 1 | 2;
const DENSITIES: readonly Density[] = [0, 1, 2];

function packAppointment(
  name: string,
  payload: ContactPayload,
  density: Density,
): string {
  const reply = `${payload.replyChannel === "call" ? "Call" : "Text"} ${toGsm7(
    formatPhone(payload.phone),
  )}`;
  const day = payload.primary.date ? formatSmsDate(payload.primary.date) : "-";

  return [
    "Hair 7 booking",
    name,
    reply,
    day,
    describeWindowsSms(payload.primary, density >= 2),
    describeServicesSms(payload.services, density >= 1),
  ].join("\n");
}

/** Booking SMS before notes, fitted to the requested GSM-7 character budget. */
export function appointmentSmsBase(
  payload: ContactPayload,
  maxLength: number = SMS_SEGMENT_LENGTH,
): string {
  const fullName = toGsm7(payload.name.trim()) || "?";
  let body = "";
  for (const density of DENSITIES) {
    body = packAppointment(fullName, payload, density);
    if (body.length <= maxLength) return body;
  }

  // Everything else is already compact, so the name is the last thing to give.
  // Always shorten the original name with a trailing "..." — never slice the
  // packed message, which could cut a word in half with no ellipsis.
  let allowed = Math.max(4, fullName.length - (body.length - maxLength));
  let name = fit(fullName, allowed);
  body = packAppointment(name, payload, 2);
  while (body.length > maxLength && allowed > 4) {
    allowed -= 1;
    name = fit(fullName, allowed);
    body = packAppointment(name, payload, 2);
  }
  return body;
}

export function buildSms(
  payload: ContactPayload,
  options: BookingSmsOptions = {},
): Sms {
  if (payload.formType === "appointment") {
    if (options.manageUrl) {
      const review = `Review ${toGsm7(options.manageUrl)}`;
      const base = appointmentSmsBase(
        payload,
        Math.max(70, SMS_SEGMENT_LENGTH - review.length - 1),
      );
      return {
        to: notifyDestination(),
        body: `${base}\n${review}`.slice(0, SMS_MAX_LENGTH),
      };
    }
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

  const reply = `${payload.replyChannel === "call" ? "Call" : "Text"} ${toGsm7(
    formatPhone(payload.phone),
  )}`;
  const prefix = ["Hair 7 question", toGsm7(payload.name.trim()), reply].join(
    "\n",
  );
  const question = fit(
    payload.question,
    Math.max(0, SMS_MAX_LENGTH - prefix.length - 2),
  );
  return {
    to: notifyDestination(),
    body: `${prefix}\n\n${question}`.slice(0, SMS_MAX_LENGTH),
  };
}

/** Appended to every customer SMS. Kim's booking/question texts do not include this. */
export const CUSTOMER_SMS_OPT_OUT = "Reply STOP to opt out, HELP for help.";

function customerSms(to: string, message: string): Sms {
  return {
    to,
    body: fit(toGsm7(`${message} ${CUSTOMER_SMS_OPT_OUT}`), SMS_MAX_LENGTH),
  };
}

export function buildCustomerConfirmationSms(
  payload: ContactPayload,
  exactTime: string,
): Sms {
  const firstName = fit(payload.name.trim().split(/\s+/)[0] || "there", 30);
  const day = payload.primary.date
    ? formatFullDateLabel(payload.primary.date)
    : "your requested day";
  return customerSms(
    phoneToE164(payload.phone),
    `Hair 7: Hi ${firstName}, confirmed ${day} at ${formatExactTime(
      exactTime,
    )}. Call ${site.phone} to change.`,
  );
}

export function buildCustomerAlternativesSms(
  payload: ContactPayload,
  options: AlternativeWindow[],
): Sms {
  const firstName = fit(payload.name.trim().split(/\s+/)[0] || "there", 30);
  const choices = options
    .map(
      (option) =>
        `${formatSmsDate(option.date)} ${describeAlternativeWindow(option)}`,
    )
    .join("; ");
  return customerSms(
    phoneToE164(payload.phone),
    `Hair 7: Hi ${firstName}, Kim can offer ${choices}. Call ${site.phone} with your choice.`,
  );
}

function formatExactTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  return formatSmsTime(hours * 60 + minutes)
    .replace("a", " AM")
    .replace("p", " PM");
}

function describeAlternativeWindow(option: AlternativeWindow): string {
  const dayHours = site.hours[weekdayIndex(option.date)];
  if (!dayHours?.open || !dayHours.close) return formatSmsTime(option.start);
  const window = generateAvailabilityWindows(dayHours.open, dayHours.close).find(
    (candidate) => candidate.start === option.start,
  );
  return window
    ? `${formatSmsTime(window.start)}-${formatSmsTime(window.end)}`
    : formatSmsTime(option.start);
}
