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

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
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

  if (p.replyChannel !== "text" && p.replyChannel !== "email") {
    errors.replyChannel =
      "Please choose whether Kim should text you or email you back.";
  }

  if (p.replyChannel === "text" && !isPhone(p.phone)) {
    errors.phone = "Please enter a mobile number so Kim can text you back.";
  }

  if (p.replyChannel === "email" && !isEmail(p.email)) {
    errors.email = "Please enter an email address so Kim can write back.";
  }

  if (p.formType === "appointment") {
    const hasSlot = Boolean(p.primary.date) && p.primary.slot !== null;
    if (!p.primary.flexible && !hasSlot) {
      errors.primary =
        "Please pick a day and a time, or choose “I’m flexible” below.";
    }
  }

  if (p.formType === "question" && !p.question.trim()) {
    errors.question = "Please type your question so Kim can answer it.";
  }

  return errors;
}
