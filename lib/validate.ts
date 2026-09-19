/**
 * Validation shared by the browser and the API route, so the rules can't drift.
 * Messages are written in plain words on purpose — "Invalid input" tells a
 * 72-year-old nothing about what to do next.
 */

import type { ContactPayload } from "./types";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isPhone(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 10 || (d.length === 11 && d.startsWith("1"));
}

/**
 * Live mask for the mobile-number field: formats as you type, so the field
 * always reads (650) 949-0796 no matter how someone enters it.
 *
 * Formats only the digits actually present, which keeps backspace working —
 * a mask that pins the punctuation in place traps people on the "(" and is
 * exactly the kind of thing that loses this audience.
 */
export function formatPhoneInput(raw: string): string {
  let d = digitsOnly(raw);
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1); // pasted +1…
  d = d.slice(0, 10);

  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** "6505550147" -> "(650) 555-0147". Anything unexpected is passed through. */
export function formatPhone(value: string): string {
  const d = digitsOnly(value);
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length !== 10) return value.trim();
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/** Field name -> message. An empty object means the form is good to send. */
export function validateContact(p: ContactPayload): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!p.name.trim()) {
    errors.name = "Please enter your name so Kim knows who's asking.";
  }

  if (p.replyChannel !== "text" && p.replyChannel !== "call") {
    errors.replyChannel =
      "Please choose whether Kim should text or call you back.";
  }

  if (p.replyChannel && !isPhone(p.phone)) {
    errors.phone =
      p.replyChannel === "text"
        ? "Please enter a mobile number so Kim can text you back."
        : "Please enter a phone number so Kim can call you back.";
  }

  if (p.formType === "appointment") {
    if (!p.primary.date) {
      errors.primary = "Please pick a day.";
    } else if (p.primary.slots.length === 0) {
      errors.primary = "Please choose at least one time window that works for you.";
    }
  }

  if (p.formType === "question" && !p.question.trim()) {
    errors.question = "Please type your question so Kim can answer it.";
  }

  return errors;
}
