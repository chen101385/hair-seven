import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getRedis } from "./booking-requests";
import { listClosableDays } from "./hours";

const DATES_KEY = "hair7:closed-days";
const PIN_KEY = "hair7:closed-pin";
const COOLDOWN_KEY = "hair7:closed-code:cooldown";
const HOUR_KEY = "hair7:closed-code:hour";
const DAY_KEY = "hair7:closed-code:day";

const PIN_TTL_SECONDS = 10 * 60;
const COOLDOWN_SECONDS = 2 * 60;
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * 60 * 60;
const MAX_PER_HOUR = 3;
const MAX_PER_DAY = 8;
const MAX_GUESSES = 5;

export const CODE_WAIT =
  "A code was just sent. Please wait a few minutes before asking again.";
export const CODE_TOO_MANY =
  "Too many codes were sent. Please try again later.";
export const CODE_UNAVAILABLE =
  "A code cannot be sent right now. Please try again later.";

type PinRecord = { hash: string; attempts: number };

export function closedDaysPhone(): string | null {
  const raw = process.env.CLOSED_DAYS_PHONE?.trim() ?? "";
  return /^\+[1-9]\d{7,14}$/.test(raw) ? raw : null;
}

function pinSecret(): string | null {
  const value = process.env.CLOSED_DAYS_SECRET?.trim();
  return value ? value : null;
}

function hashPin(code: string, key: string): string {
  return createHmac("sha256", key).update(code).digest("base64url");
}

export function codeSendBlock(state: {
  cooldown: boolean;
  hourCount: number;
  dayCount: number;
}): string | null {
  if (state.dayCount > MAX_PER_DAY || state.hourCount > MAX_PER_HOUR) {
    return CODE_TOO_MANY;
  }
  if (state.cooldown) return CODE_WAIT;
  return null;
}

export async function listClosedDays(): Promise<string[]> {
  try {
    const redis = getRedis();
    if (!redis) return [];
    const value = await redis.get<unknown>(DATES_KEY);
    const dates = Array.isArray(value) ? value : [];
    return dates.filter(
      (date): date is string =>
        typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
    );
  } catch (error) {
    console.error("[hair-seven] closed days unreadable:", error);
    return [];
  }
}

export function isClosableDate(date: string, now = new Date()): boolean {
  return listClosableDays(now).some((day) => day.date === date);
}

export async function setDateClosed(
  date: string,
  closed: boolean,
  now = new Date(),
): Promise<string[] | null> {
  if (!isClosableDate(date, now)) return null;
  const redis = getRedis();
  if (!redis) return null;
  const current = new Set(await listClosedDays());
  if (closed) current.add(date);
  else current.delete(date);
  const next = [...current].sort();
  await redis.set(DATES_KEY, next);
  return next;
}

/**
 * Asks Redis whether another code may be sent, and counts this attempt.
 * Fails closed: no Redis means no text.
 */
export async function reserveCodeSend(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const redis = getRedis();
  if (!redis || !closedDaysPhone() || !pinSecret()) {
    return { ok: false, message: CODE_UNAVAILABLE };
  }

  const cooling = await redis.get(COOLDOWN_KEY);
  if (cooling) return { ok: false, message: CODE_WAIT };

  const dayCount = await redis.incr(DAY_KEY);
  if (dayCount === 1) await redis.expire(DAY_KEY, DAY_SECONDS);
  const hourCount = await redis.incr(HOUR_KEY);
  if (hourCount === 1) await redis.expire(HOUR_KEY, HOUR_SECONDS);

  const blocked = codeSendBlock({ cooldown: false, hourCount, dayCount });
  if (blocked) return { ok: false, message: blocked };

  await redis.set(COOLDOWN_KEY, "1", { ex: COOLDOWN_SECONDS });
  return { ok: true };
}

export async function storePin(code: string): Promise<boolean> {
  const key = pinSecret();
  const redis = getRedis();
  if (!key || !redis) return false;
  const record: PinRecord = { hash: hashPin(code, key), attempts: 0 };
  await redis.set(PIN_KEY, record, { ex: PIN_TTL_SECONDS });
  return true;
}

export function newPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function checkPin(
  code: string,
): Promise<"ok" | "wrong" | "expired"> {
  const key = pinSecret();
  const redis = getRedis();
  if (!key || !redis || !/^\d{6}$/.test(code)) return "wrong";

  const record = await redis.get<PinRecord>(PIN_KEY);
  if (!record?.hash) return "expired";
  if (record.attempts >= MAX_GUESSES) {
    await redis.del(PIN_KEY);
    return "expired";
  }

  const actual = Buffer.from(hashPin(code, key));
  const expected = Buffer.from(record.hash);
  const match =
    actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!match) {
    const ttl = await redis.ttl(PIN_KEY);
    await redis.set(
      PIN_KEY,
      { hash: record.hash, attempts: record.attempts + 1 },
      { ex: ttl > 0 ? ttl : PIN_TTL_SECONDS },
    );
    return "wrong";
  }

  await redis.del(PIN_KEY);
  return "ok";
}
