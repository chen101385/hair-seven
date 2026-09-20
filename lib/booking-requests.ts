import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { ContactPayload } from "./types";

const REQUEST_TTL_SECONDS = 7 * 24 * 60 * 60;
const KEY_PREFIX = "hair7:booking:";
const LOCK_PREFIX = "hair7:booking-lock:";

export type AlternativeWindow = { date: string; start: number };

export type BookingDecision =
  | { kind: "confirmed"; time: string; sentAt: string }
  | { kind: "alternatives"; options: AlternativeWindow[]; sentAt: string };

export type StoredBookingRequest = {
  token: string;
  payload: ContactPayload;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "completed";
  decision?: BookingDecision;
};

declare global {
  var hairSevenBookingRequests:
    | Map<string, StoredBookingRequest>
    | undefined;
  var hairSevenBookingLocks: Set<string> | undefined;
}

const localRequests =
  globalThis.hairSevenBookingRequests ??
  (globalThis.hairSevenBookingRequests = new Map());
const localLocks =
  globalThis.hairSevenBookingLocks ??
  (globalThis.hairSevenBookingLocks = new Set());

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

export function hasDurableBookingStorage(): boolean {
  return redisClient() !== null;
}

export async function createBookingRequest(
  payload: ContactPayload,
): Promise<StoredBookingRequest> {
  const token = randomBytes(18).toString("base64url");
  const now = Date.now();
  const record: StoredBookingRequest = {
    token,
    payload,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + REQUEST_TTL_SECONDS * 1000).toISOString(),
    status: "pending",
  };
  const redis = redisClient();
  if (redis) {
    await redis.set(`${KEY_PREFIX}${token}`, record, {
      ex: REQUEST_TTL_SECONDS,
    });
  } else {
    pruneLocal(now);
    localRequests.set(token, record);
  }
  return record;
}

export async function getBookingRequest(
  token: string,
): Promise<StoredBookingRequest | null> {
  if (!isToken(token)) return null;
  const redis = redisClient();
  if (redis) {
    return (await redis.get<StoredBookingRequest>(
      `${KEY_PREFIX}${token}`,
    )) ?? null;
  }
  const record = localRequests.get(token) ?? null;
  if (record && Date.parse(record.expiresAt) <= Date.now()) {
    localRequests.delete(token);
    return null;
  }
  return record;
}

export async function saveBookingRequest(
  record: StoredBookingRequest,
): Promise<void> {
  const secondsLeft = Math.max(
    1,
    Math.ceil((Date.parse(record.expiresAt) - Date.now()) / 1000),
  );
  const redis = redisClient();
  if (redis) {
    await redis.set(`${KEY_PREFIX}${record.token}`, record, {
      ex: secondsLeft,
    });
  } else {
    localRequests.set(record.token, record);
  }
}

export async function withBookingLock<T>(
  token: string,
  work: () => Promise<T>,
): Promise<T> {
  const redis = redisClient();
  if (redis) {
    const lockKey = `${LOCK_PREFIX}${token}`;
    const acquired = await redis.set(lockKey, "1", { nx: true, ex: 30 });
    if (!acquired) throw new Error("BOOKING_BUSY");
    try {
      return await work();
    } finally {
      await redis.del(lockKey);
    }
  }

  if (localLocks.has(token)) throw new Error("BOOKING_BUSY");
  localLocks.add(token);
  try {
    return await work();
  } finally {
    localLocks.delete(token);
  }
}

export function bookingResponseUrl(request: Request, token: string): string {
  const requestOrigin = new URL(request.url).origin;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin =
    configured && !/^https?:\/\/localhost(?::\d+)?$/i.test(configured)
      ? configured.replace(/\/$/, "")
      : requestOrigin;
  return `${origin}/kim/${token}`;
}

function isToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{24}$/.test(value);
}

function pruneLocal(now: number) {
  for (const [token, record] of localRequests) {
    if (Date.parse(record.expiresAt) <= now) localRequests.delete(token);
  }
}
