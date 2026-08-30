export type FormType = "appointment" | "question";
export type ReplyChannel = "text" | "email";

/** What the day/time picker holds. Used for both the primary and backup slot. */
export type PickerValue = {
  /** "2026-09-18" */
  date: string | null;
  /** Minutes past midnight, e.g. 840 for 2:00 PM */
  slot: number | null;
  /** "I'm flexible / none of these work" */
  flexible: boolean;
  /** Free text shown when flexible is on */
  flexibleText: string;
};

export const emptyPicker: PickerValue = {
  date: null,
  slot: null,
  flexible: false,
  flexibleText: "",
};

export type ContactPayload = {
  formType: FormType;
  name: string;
  replyChannel: ReplyChannel | null;
  phone: string;
  email: string;

  // Appointment only
  service: string;
  primary: PickerValue;
  backup: PickerValue;
  backupOpen: boolean;
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
