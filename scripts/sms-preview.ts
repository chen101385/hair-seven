/**
 * Prints the exact text Kim receives, without filling in the form.
 * `npm run sms:preview`
 *
 * Three examples: no note, a short note that still fits one text, and a note
 * long enough to spill into a second text.
 */

import { addDays, salonNow, getAvailableDays } from "../lib/hours";
import { formatStub } from "../lib/notify";
import { buildSms } from "../lib/sms";
import { emptyPicker, type ContactPayload } from "../lib/types";

const day = getAvailableDays()[0];

const base: ContactPayload = {
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  services: ["Haircut", "Hair coloring"],
  primary: {
    ...emptyPicker,
    date: day?.date ?? addDays(salonNow().date, 1),
    slots: day ? day.slots.map((slot) => slot.start) : [600, 720, 900],
  },
  notes: "",
  question: "",
  company: "",
  elapsedMs: 20_000,
};

const examples: { label: string; payload: ContactPayload }[] = [
  { label: "Booking, no note", payload: base },
  {
    label: "Booking, short note",
    payload: { ...base, notes: "Please use the side door." },
  },
  {
    label: "Booking, long note",
    payload: {
      ...base,
      notes:
        "I am flexible on the exact time but would rather not be in the chair over lunch, and I may bring my daughter along for a trim as well.",
    },
  },
  {
    label: "Question",
    payload: {
      ...base,
      formType: "question",
      replyChannel: "call",
      question: "Do you do grey coverage, and how long does it take?",
    },
  },
];

for (const { label, payload } of examples) {
  console.log(`\n### ${label}`);
  console.log(formatStub(buildSms(payload)));
}
