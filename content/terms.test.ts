import { describe, expect, it } from "vitest";
import { terms } from "./terms";

const body = terms.sections
  .flatMap((section) => [section.heading, ...section.paragraphs])
  .join("\n");

describe("SMS terms of service", () => {
  it("covers the toll-free verification checklist", () => {
    expect(terms.path).toBe("/terms");
    expect(body).toMatch(/never pre-checked/i);
    expect(body).toMatch(/\bSTOP\b/);
    expect(body).toMatch(/\bHELP\b/);
    expect(body).toMatch(/Message and data rates may apply/i);
    expect(body).toMatch(/frequency varies/i);
    expect(body).toMatch(/not a condition/i);
  });
});
