/**
 * Prints the exact text Kim receives, without filling in the form.
 * `npm run sms:preview`
 *
 * Three examples: no note, a short note that still fits one text, and a note
 * long enough to spill into a second text.
 */

import { addDays, salonNow, getAvailableDays } from "../lib/hours";
import { formatStub } from "../lib/notify";
import {
  buildCustomerAlternativesSms,
  buildCustomerConfirmationSms,
  buildSms,
} from "../lib/sms";
import { emptyPicker, type ContactPayload } from "../lib/types";

const days = getAvailableDays();
const day = days[0];

const base: ContactPayload = {
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  smsConsent: true,
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

const examples = [
  {
    label: "Booking link to Kim",
    sms: buildSms(base, {
      manageUrl: "https://hair7salon.com/kim/abcdefghijklmnop",
    }),
  },
  {
    label: "Confirmed appointment to customer",
    sms: buildCustomerConfirmationSms(base, "15:30"),
  },
  {
    label: "Alternative times to customer",
    sms: buildCustomerAlternativesSms(
      base,
      days.slice(1, 3).map((available) => ({
        date: available.date,
        start: available.slots[0].start,
      })),
    ),
  },
  {
    label: "Question",
    sms: buildSms({
      ...base,
      formType: "question",
      replyChannel: "call",
      question: "Do you do grey coverage, and how long does it take?",
    }),
  },
];

for (const { label, sms } of examples) {
  console.log(`\n### ${label}`);
  console.log(
    formatStub(
      sms,
      [],
      label.includes("customer") ? "the customer" : "Kim",
    ),
  );
}
