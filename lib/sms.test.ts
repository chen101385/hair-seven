import { describe, expect, it } from "vitest";
import {
  appointmentSmsBase,
  buildCustomerAlternativesSms,
  buildCustomerConfirmationSms,
  buildSms,
  SMS_MAX_LENGTH,
  SMS_SEGMENT_LENGTH,
  toGsm7,
} from "./sms";
import { emptyPicker, MAX_NOTES_LENGTH, type ContactPayload } from "./types";

const payload = (over: Partial<ContactPayload> = {}): ContactPayload => ({
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  smsConsent: true,
  services: ["Haircut"],
  primary: { ...emptyPicker, date: "2026-09-03", slots: [600, 900] },
  notes: "",
  question: "",
  company: "",
  elapsedMs: 20_000,
  ...over,
});

describe("buildSms", () => {
  it("keeps a complete booking on one GSM-7 text when there are no notes", () => {
    const sms = buildSms(
      payload({
        name: "A".repeat(120),
        services: ["Hair coloring"],
        primary: { date: "2026-09-03", slots: [600, 720, 900] },
      }),
    );

    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(sms.body).toContain("Hair7 BOOK");
    expect(sms.body).toContain("T (650) 555-0147");
    expect(sms.body).toContain("Thu Sep 3");
    expect(sms.body).toContain("10a-12p");
    expect(sms.body).toContain("12p-3p");
    expect(sms.body).toContain("3p-6p");
    expect(sms.to).toBe("+16509490796");
    expect(sms.body).toBe(toGsm7(sms.body));
  });

  it("only exceeds one text when a long enough note is added", () => {
    const withoutNotes = appointmentSmsBase(payload());
    const withNotes = buildSms(payload({ notes: "x".repeat(120) })).body;

    expect(withoutNotes.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(withNotes.length).toBeGreaterThan(SMS_SEGMENT_LENGTH);
    expect(withNotes.startsWith(withoutNotes)).toBe(true);
  });

  it("labels a phone callback with C", () => {
    expect(buildSms(payload({ replyChannel: "call" })).body).toContain(
      "C (650) 555-0147",
    );
  });

  it("never exceeds two concatenated segments with every service and max notes", () => {
    const sms = buildSms(
      payload({
        name: "A".repeat(120),
        services: ["Haircut", "Hair styling", "Hair coloring", "Waxing"],
        primary: { date: "2026-09-03", slots: [600, 720, 900] },
        notes: "x".repeat(MAX_NOTES_LENGTH),
      }),
    );

    expect(sms.body).toHaveLength(SMS_MAX_LENGTH);
    expect(sms.body).toContain("Svc Cut/Style/Color/Wax");
    expect(sms.body.endsWith("x".repeat(MAX_NOTES_LENGTH))).toBe(true);
  });

  it("caps a long name with an ellipsis so the SMS stays at 306 characters", () => {
    const name =
      "Christopher Chen with the longest possible family name recorded at the salon desk today";
    const sms = buildSms(
      payload({
        name,
        services: ["Haircut", "Hair styling", "Hair coloring", "Waxing"],
        primary: { date: "2026-09-03", slots: [600, 720, 900] },
        notes: "x".repeat(187),
      }),
    );
    const nameLine = sms.body.split("\n")[1];

    expect(sms.body.startsWith("Hair7 BOOK\n")).toBe(true);
    expect(sms.body).toHaveLength(SMS_MAX_LENGTH);
    expect(nameLine).toBe("Christopher Chen with the long...");
    expect(sms.body.endsWith("x".repeat(187))).toBe(true);
  });

  it("puts the secure Kim link in the booking text and leaves notes on the page", () => {
    const manageUrl = "https://hair7.example/kim/abcdefghijklmnopqrstuvwx";
    const sms = buildSms(payload({ notes: "Private timing note" }), {
      manageUrl,
    });

    expect(sms.body).toContain("Hair7 BOOK");
    expect(sms.body).toContain(`Review ${manageUrl}`);
    expect(sms.body).not.toContain("Private timing note");
    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
  });

  it("builds fixed customer confirmation and alternative templates", () => {
    const confirmed = buildCustomerConfirmationSms(payload(), "15:30");
    const alternatives = buildCustomerAlternativesSms(payload(), [
      { date: "2026-09-08", start: 840 },
      { date: "2026-09-09", start: 600 },
    ]);

    expect(confirmed.to).toBe("+16505550147");
    expect(confirmed.body).toContain("confirmed Thursday, Sep 3 at 3:30 PM");
    expect(confirmed.body).toContain("Reply STOP to opt out, HELP for help");
    expect(confirmed.body).not.toMatch(/data rates/i);
    expect(alternatives.body).toContain("Kim can offer");
    expect(alternatives.body).toContain("Tue Sep 8 2p-6p");
    expect(alternatives.body).toContain("Wed Sep 9 10a-12p");
    expect(alternatives.body).toContain("Reply STOP to opt out");
    expect(confirmed.body).toBe(toGsm7(confirmed.body));
    expect(alternatives.body).toBe(toGsm7(alternatives.body));
    expect(alternatives.body.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
  });
});
