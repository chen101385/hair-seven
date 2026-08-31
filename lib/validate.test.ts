import { describe, expect, it } from "vitest";
import { emptyPicker } from "./types";
import type { ContactPayload } from "./types";
import {
  digitsOnly,
  formatPhone,
  formatPhoneInput,
  isEmail,
  isPhone,
  validateContact,
} from "./validate";

const payload = (over: Partial<ContactPayload> = {}): ContactPayload => ({
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  email: "",
  service: "Haircut",
  primary: { ...emptyPicker, date: "2026-09-03", slots: [840] },
  notes: "",
  question: "",
  company: "",
  elapsedMs: 20_000,
  ...over,
});

describe("phone handling", () => {
  it("strips everything that isn't a digit", () => {
    expect(digitsOnly("+1 (650) 949-0796")).toBe("16509490796");
  });

  it("accepts 10 digits, or 11 starting with a country code", () => {
    expect(isPhone("6505550147")).toBe(true);
    expect(isPhone("(650) 555-0147")).toBe(true);
    expect(isPhone("+1 650 555 0147")).toBe(true);
    expect(isPhone("650555014")).toBe(false); // nine
    expect(isPhone("26505550147")).toBe(false); // eleven, wrong prefix
    expect(isPhone("")).toBe(false);
  });

  it("masks progressively so backspace never gets stuck", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("6")).toBe("(6");
    expect(formatPhoneInput("650")).toBe("(650");
    expect(formatPhoneInput("6505")).toBe("(650) 5");
    expect(formatPhoneInput("650555")).toBe("(650) 555");
    expect(formatPhoneInput("6505550")).toBe("(650) 555-0");
    expect(formatPhoneInput("6505550147")).toBe("(650) 555-0147");
  });

  it("survives whatever someone pastes in", () => {
    expect(formatPhoneInput("+1 (650) 555-0147")).toBe("(650) 555-0147");
    expect(formatPhoneInput("650.555.0147")).toBe("(650) 555-0147");
    expect(formatPhoneInput("650555014799999")).toBe("(650) 555-0147");
    expect(formatPhoneInput("no digits here")).toBe("");
  });

  it("formats a stored number for the email, and passes odd ones through", () => {
    expect(formatPhone("6505550147")).toBe("(650) 555-0147");
    expect(formatPhone("16505550147")).toBe("(650) 555-0147");
    expect(formatPhone("  ext 4  ")).toBe("ext 4");
  });
});

describe("isEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isEmail("kim@example.com")).toBe(true);
    expect(isEmail("  ruth.alvarez+salon@mail.example.co.uk  ")).toBe(true);
  });

  it("rejects the shapes people actually mistype", () => {
    expect(isEmail("kim@example")).toBe(false); // no TLD
    expect(isEmail("kim.example.com")).toBe(false); // missing @
    expect(isEmail("kim@example.c")).toBe(false); // one-letter TLD
    expect(isEmail("kim @example.com")).toBe(false); // space
    expect(isEmail("")).toBe(false);
  });
});

describe("validateContact", () => {
  it("passes a complete appointment request", () => {
    expect(validateContact(payload())).toEqual({});
  });

  it("passes a complete question", () => {
    const p = payload({
      formType: "question",
      replyChannel: "email",
      phone: "",
      email: "ruth@example.com",
      primary: { ...emptyPicker },
      question: "Do you do perms?",
    });
    expect(validateContact(p)).toEqual({});
  });

  it("asks for a name", () => {
    expect(validateContact(payload({ name: "   " }))).toHaveProperty("name");
  });

  it("asks how Kim should reply", () => {
    expect(validateContact(payload({ replyChannel: null }))).toHaveProperty(
      "replyChannel",
    );
  });

  it("only requires the contact field for the channel they chose", () => {
    // Chose text, gave no number.
    expect(validateContact(payload({ phone: "" }))).toHaveProperty("phone");
    // Chose text, gave no email — that's fine, she isn't going to email.
    expect(validateContact(payload({ email: "" }))).not.toHaveProperty("email");
    // Chose email, gave no address.
    const byEmail = payload({ replyChannel: "email", phone: "", email: "" });
    expect(validateContact(byEmail)).toHaveProperty("email");
    expect(validateContact(byEmail)).not.toHaveProperty("phone");
  });

  it("requires a day and at least one time on the appointment form", () => {
    expect(
      validateContact(payload({ primary: { ...emptyPicker } })),
    ).toHaveProperty("primary");
    expect(
      validateContact(
        payload({ primary: { ...emptyPicker, date: "2026-09-03", slots: [] } }),
      ),
    ).toHaveProperty("primary");
  });

  it("accepts a flexible request with no day or time at all", () => {
    const p = payload({
      primary: { ...emptyPicker, flexible: true, flexibleText: "any afternoon" },
    });
    expect(validateContact(p)).toEqual({});
  });

  it("never asks the question form to pick a time", () => {
    const p = payload({
      formType: "question",
      primary: { ...emptyPicker },
      question: "Are you open Labor Day?",
    });
    expect(validateContact(p)).not.toHaveProperty("primary");
  });

  it("requires the question itself", () => {
    const p = payload({ formType: "question", primary: { ...emptyPicker } });
    expect(validateContact(p)).toHaveProperty("question");
  });
});
