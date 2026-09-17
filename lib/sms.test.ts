import { describe, expect, it } from "vitest";
import { appointmentSmsBase, buildSms, SMS_SEGMENT_LENGTH, toGsm7 } from "./sms";
import { emptyPicker, type ContactPayload } from "./types";

const payload = (over: Partial<ContactPayload> = {}): ContactPayload => ({
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  service: "Haircut",
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
        service: "Hair coloring",
        primary: { date: "2026-09-03", slots: [600, 720, 900] },
      }),
    );

    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(sms.body).toContain("Hair7 book");
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

});
