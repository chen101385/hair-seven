/**
 * Paste-ready A2P 10DLC campaign copy. Keep it aligned with lib/sms.ts.
 * Print with `npm run sms:campaign`.
 */

import { emptyPicker, type ContactPayload } from "../lib/types";
import {
  buildCustomerAlternativesSms,
  buildCustomerConfirmationSms,
  CUSTOMER_SMS_OPT_OUT,
  toGsm7,
} from "../lib/sms";

const sampleCustomer: ContactPayload = {
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  smsConsent: true,
  services: ["Haircut", "Hair coloring"],
  primary: { ...emptyPicker, date: "2026-09-03", slots: [600, 900] },
  notes: "",
  question: "",
  company: "",
  elapsedMs: 20_000,
};

export const campaign = {
  useCase:
    "Customer Care. Hair 7 texts people only about the appointment or question they submitted on this website: a confirmation of the time Kim booked, or alternative times if that window is taken. No marketing, coupons, or recurring campaigns.",
  messages: [
    {
      label: "Sample 1 - appointment confirmation",
      body: buildCustomerConfirmationSms(sampleCustomer, "15:30").body,
    },
    {
      label: "Sample 2 - alternative times",
      body: buildCustomerAlternativesSms(sampleCustomer, [
        { date: "2026-09-08", start: 840 },
        { date: "2026-09-09", start: 600 },
      ]).body,
    },
    {
      label: "Sample 3 - HELP auto-reply (set this in Twilio, not the app)",
      body: toGsm7(
        `Hair 7: For help, call (650) 949-0796. ${CUSTOMER_SMS_OPT_OUT}`,
      ),
    },
    {
      label: "Sample 4 - STOP auto-reply (Twilio Advanced Opt-Out; customize)",
      body: toGsm7(
        "Hair 7: You are opted out and will not receive more texts from us. Reply START to opt in again, or call (650) 949-0796.",
      ),
    },
  ],
  notes: [
    "Campaign samples are the texts customers receive. Do not submit Hair7 BOOK or Hair7 Q; those go to Kim.",
    "Enable Twilio Advanced Opt-Out so STOP/START/HELP are handled even without a webhook.",
    "Opt-out lives in every customer SMS from this app. Kim's notification texts do not include STOP.",
    "Message and data rates stay on the website form, /terms, and /privacy, not in the SMS body.",
    "Opt-in is a web form at https://hair7salon.com/#book: Text me, mobile number, unchecked consent checkbox, then submit.",
  ],
} as const;
