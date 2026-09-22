import { describe, expect, it } from "vitest";
import { privacy } from "./privacy";

const body = privacy.sections
  .flatMap((section) => [section.heading, ...section.paragraphs])
  .join("\n");

describe("privacy policy SMS language", () => {
  it("covers consent, handling, opt-out, and no marketing share", () => {
    expect(body).toMatch(/phone number/i);
    expect(body).toMatch(/SMS/i);
    expect(body).toMatch(/consent/i);
    expect(body).toMatch(/\bSTOP\b/);
    expect(body).toMatch(/\bHELP\b/);
    expect(body).toMatch(/does not sell, rent, or share/i);
    expect(body).toMatch(/marketing/i);
    expect(body).toMatch(/Twilio/);
    expect(privacy.path).toBe("/privacy");
    expect(body).toMatch(/never pre-checked/i);
  });
});
