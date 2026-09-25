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

/** Production links look like this: 27-character prefix plus a 16-character token. */
const manageUrl = "https://hair7salon.com/kim/K8CGUlERUe3vXff0";

describe("buildSms", () => {
  it("spells out a typical booking in plain words on one text", () => {
    const sms = buildSms(
      payload({
        name: "Christopher Chen",
        services: ["Haircut", "Hair coloring"],
        primary: { date: "2026-09-30", slots: [720, 900] },
      }),
      { manageUrl },
    );

    expect(sms.body).toBe(
      [
        "Hair 7 booking",
        "Christopher Chen",
        "Text (650) 555-0147",
        "Wed Sep 30",
        "12pm-3pm, 3pm-6pm",
        "Haircut, Coloring",
        `Review ${manageUrl}`,
      ].join("\n"),
    );
    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(sms.to).toBe("+16509490796");
    expect(sms.body).toBe(toGsm7(sms.body));
  });

  it("abbreviates services, then times, before touching the name", () => {
    const full = payload({
      name: "Christopher Chen",
      services: ["Haircut", "Hair styling", "Hair coloring", "Waxing"],
      primary: { date: "2026-09-03", slots: [600, 720, 900] },
    });
    const sms = buildSms(full, { manageUrl });

    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(sms.body).toContain("\nChristopher Chen\n");
    expect(sms.body).toContain("Cut, Style, Color, Wax");
    expect(sms.body).toContain("10a-12p, 12p-3p, 3p-6p");
    expect(sms.body).toContain(`Review ${manageUrl}`);
  });

  it("keeps a complete booking on one GSM-7 text when there are no notes", () => {
    const sms = buildSms(
      payload({
        name: "A".repeat(120),
        services: ["Hair coloring"],
        primary: { date: "2026-09-03", slots: [600, 720, 900] },
      }),
    );

    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(sms.body).toContain("Hair 7 booking");
    expect(sms.body).toContain("Text (650) 555-0147");
    expect(sms.body).toContain("Thu Sep 3");
    expect(sms.body).toContain("10a-12p");
    expect(sms.body).toContain("12p-3p");
    expect(sms.body).toContain("3p-6p");
    expect(sms.body).toBe(toGsm7(sms.body));
  });

  it("only exceeds one text when a long enough note is added", () => {
    const withoutNotes = appointmentSmsBase(payload());
    const withNotes = buildSms(payload({ notes: "x".repeat(120) })).body;

    expect(withoutNotes.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
    expect(withNotes.length).toBeGreaterThan(SMS_SEGMENT_LENGTH);
    expect(withNotes.startsWith(withoutNotes)).toBe(true);
  });

  it("labels a phone callback with Call", () => {
    expect(buildSms(payload({ replyChannel: "call" })).body).toContain(
      "Call (650) 555-0147",
    );
  });

  it("says so when no service was picked", () => {
    expect(buildSms(payload({ services: [] })).body).toContain(
      "Service not chosen",
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
    expect(sms.body).toContain("Cut, Style, Color, Wax");
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

    expect(sms.body.startsWith("Hair 7 booking\n")).toBe(true);
    expect(sms.body).toHaveLength(SMS_MAX_LENGTH);
    expect(nameLine).toBe("Christopher Chen with th...");
    expect(sms.body.endsWith("x".repeat(187))).toBe(true);
  });

  it("puts the secure Kim link in the booking text and leaves notes on the page", () => {
    const sms = buildSms(payload({ notes: "Private timing note" }), {
      manageUrl,
    });

    expect(sms.body).toContain("Hair 7 booking");
    expect(sms.body).toContain(`Review ${manageUrl}`);
    expect(sms.body).not.toContain("Private timing note");
    expect(sms.body.length).toBeLessThanOrEqual(SMS_SEGMENT_LENGTH);
  });

  it("writes the question text in the same plain style", () => {
    const sms = buildSms(
      payload({
        formType: "question",
        replyChannel: "call",
        primary: { ...emptyPicker },
        question: "Do you do perms?",
      }),
    );

    expect(sms.body.startsWith("Hair 7 question\nRuth Alvarez\nCall (650) 555-0147\n")).toBe(
      true,
    );
    expect(sms.body).toContain("Do you do perms?");
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
