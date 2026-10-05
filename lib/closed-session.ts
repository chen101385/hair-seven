import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "hair7_closed";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const CLOSED_COOKIE = COOKIE;
export const CLOSED_COOKIE_MAX_AGE = MAX_AGE_MS / 1000;

function secret(): string | null {
  const value = process.env.CLOSED_DAYS_SECRET?.trim();
  return value ? value : null;
}

export function createSessionToken(now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const exp = now + MAX_AGE_MS;
  const sig = createHmac("sha256", key).update(String(exp)).digest("base64url");
  return `${exp}.${sig}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  const key = secret();
  if (!key || !token) return false;
  const [expRaw, sig] = token.split(".");
  if (!expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const expected = createHmac("sha256", key).update(String(exp)).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
