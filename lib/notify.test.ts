import { describe, expect, it } from "vitest";
import { buildSms } from "./notify";
import { emptyPicker, type ContactPayload } from "./types";

const payload = (over: Partial<ContactPayload> = {}): ContactPayload => ({
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  service: "Haircut",
  primary: { ...emptyPicker, date: "2026-09-03", slots: [600, 900] },
  notes: "Late afternoon is easiest.",
  question: "",
  company: "",
  elapsedMs: 20_000,
  ...over,
});

describe("buildSms", () => {
  it("includes the day, every selected window, and timing notes", () => {
    const sms = buildSms(payload());

    expect(sms.body).toContain("HAIR 7 BOOKING REQUEST");
    expect(sms.body).toContain("Reply: TEXT (650) 555-0147");
    expect(sms.body).toContain("Day: Thursday, Sep 3");
    expect(sms.body).toContain("Morning (10:00 AM–12:00 PM)");
    expect(sms.body).toContain("Early evening (3:00 PM–6:00 PM)");
    expect(sms.body).toContain("Notes: Late afternoon is easiest.");
  });

  it("labels phone callbacks clearly", () => {
    const sms = buildSms(payload({ replyChannel: "call" }));
    expect(sms.body).toContain("Reply: CALL (650) 555-0147");
  });
});
