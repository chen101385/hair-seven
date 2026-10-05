import { describe, expect, it } from "vitest";
import { codeSendBlock, CODE_TOO_MANY, CODE_WAIT } from "./closed-days";
import { createSessionToken, verifySessionToken } from "./closed-session";

describe("closed-day code limits", () => {
  it("allows a send inside the hour and day caps", () => {
    expect(codeSendBlock({ cooldown: false, hourCount: 1, dayCount: 1 })).toBeNull();
  });

  it("stops a second send during the cooldown", () => {
    expect(codeSendBlock({ cooldown: true, hourCount: 1, dayCount: 1 })).toBe(CODE_WAIT);
  });

  it("stops the fourth code in an hour and the ninth in a day", () => {
    expect(codeSendBlock({ cooldown: false, hourCount: 4, dayCount: 4 })).toBe(CODE_TOO_MANY);
    expect(codeSendBlock({ cooldown: false, hourCount: 1, dayCount: 9 })).toBe(CODE_TOO_MANY);
  });
});

describe("closed-day session", () => {
  it("accepts a token it just signed and rejects a tampered one", () => {
    process.env.CLOSED_DAYS_SECRET = "test-secret";
    try {
      const token = createSessionToken(1_000);
      expect(token).toBeTruthy();
      expect(verifySessionToken(token!, 1_000)).toBe(true);
      expect(verifySessionToken(token!, 1_000 + 31 * 24 * 60 * 60 * 1000)).toBe(false);
      expect(verifySessionToken(`${token}x`, 1_000)).toBe(false);
    } finally {
      delete process.env.CLOSED_DAYS_SECRET;
    }
  });
});
