export type FormType = "appointment" | "question";
export type ReplyChannel = "call" | "text";

export const MAX_NOTES_LENGTH = 240;

/**
 * What the day/time picker holds: one day, and every window on it that works for
 * the visitor. Kim keeps her appointment book on paper, so she reads the list
 * and confirms whichever one she actually has free.
 */
export type PickerValue = {
  /** "2026-09-18" */
  date: string | null;
  /** Window start times, in minutes past midnight and ascending. */
  slots: number[];
};

export const emptyPicker: PickerValue = {
  date: null,
  slots: [],
};

export type ContactPayload = {
  formType: FormType;
  name: string;
  replyChannel: ReplyChannel | null;
  phone: string;

  // Appointment only
  service: string;
  primary: PickerValue;
  notes: string;

  // Question only
  question: string;

  // Anti-spam. `company` is a honeypot: a real person never sees it.
  company: string;
  elapsedMs: number;
};

export type ContactResponse =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
