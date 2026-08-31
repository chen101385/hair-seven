export type FormType = "appointment" | "question";
export type ReplyChannel = "text" | "email";

/**
 * What the day/time picker holds: one day, and every time on it that works for
 * the visitor. Kim keeps her appointment book on paper, so she reads the list
 * and confirms whichever one she actually has free.
 */
export type PickerValue = {
  /** "2026-09-18" */
  date: string | null;
  /** Minutes past midnight, ascending. e.g. [600, 840] for 10:00 AM and 2:00 PM */
  slots: number[];
  /** "I'm flexible / none of these work" */
  flexible: boolean;
  /** Free text shown when flexible is on */
  flexibleText: string;
};

export const emptyPicker: PickerValue = {
  date: null,
  slots: [],
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
