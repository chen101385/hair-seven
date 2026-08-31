import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, clientKey, resetRateLimits } from "./rate-limit";

const HOUR = 60 * 60 * 1000;
const T0 = 1_772_000_000_000; // fixed instant; the limiter only does arithmetic

describe("checkRateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows five in an hour and refuses the sixth", () => {
    for (let i = 0; i < 5; i += 1) {
      const result = checkRateLimit("1.2.3.4", T0 + i * 1000);
      expect(result.ok).toBe(true);
    }
    const sixth = checkRateLimit("1.2.3.4", T0 + 5000);
    expect(sixth.ok).toBe(false);
  });

  it("counts down the remaining allowance", () => {
    const remaining = Array.from({ length: 5 }, (_, i) => {
      const r = checkRateLimit("1.2.3.4", T0 + i);
      return r.ok ? r.remaining : -1;
    });
    expect(remaining).toEqual([4, 3, 2, 1, 0]);
  });

  it("tells a blocked caller how long to wait", () => {
    for (let i = 0; i < 5; i += 1) checkRateLimit("1.2.3.4", T0);
    const blocked = checkRateLimit("1.2.3.4", T0 + 10 * 60 * 1000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      // 50 minutes left in the window.
      expect(blocked.retryAfterSeconds).toBe(50 * 60);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("opens a fresh window once the old one expires", () => {
    for (let i = 0; i < 5; i += 1) checkRateLimit("1.2.3.4", T0);
    expect(checkRateLimit("1.2.3.4", T0 + HOUR - 1).ok).toBe(false);
    expect(checkRateLimit("1.2.3.4", T0 + HOUR).ok).toBe(true);
  });

  it("keeps one visitor's flood off another visitor's bucket", () => {
    for (let i = 0; i < 6; i += 1) checkRateLimit("1.2.3.4", T0);
    expect(checkRateLimit("5.6.7.8", T0).ok).toBe(true);
  });
});

describe("clientKey", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://example.com/api/contact", { headers });

  it("takes the client from the front of x-forwarded-for", () => {
    expect(clientKey(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe(
      "1.2.3.4",
    );
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(clientKey(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientKey(req({}))).toBe("unknown");
    // An empty header must not become an empty key.
    expect(clientKey(req({ "x-forwarded-for": "  " }))).toBe("unknown");
  });
});
