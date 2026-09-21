/**
 * A small fixed-window limiter for the contact endpoint.
 *
 * The honeypot and the minimum time-on-page stop casual bots, but nothing
 * stopped someone hammering the endpoint — which means Kim's phone floods and
 * the SMS bill climbs. This caps it.
 *
 * Deliberately in-memory: no Redis, no extra service, nothing to pay for or
 * keep alive. The trade-off is that on a serverless host the counter is
 * per-instance, so a determined attacker spread across cold starts gets more
 * than MAX_PER_WINDOW through. It still turns "unlimited" into "a nuisance",
 * which is the right amount of engineering for a one-chair salon. If this ever
 * needs to be exact, swap the Map for Upstash or Vercel KV — the interface
 * below wouldn't change.
 */

const WINDOW_MS = 60 * 60 * 1000; // one hour
const MAX_PER_WINDOW = 5;

/** Stop the Map growing without bound on a long-lived server. */
const MAX_TRACKED_KEYS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  pruneExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_PER_WINDOW - 1 };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: MAX_PER_WINDOW - bucket.count };
}

function pruneExpired(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Best-effort client identity. Behind a proxy the first x-forwarded-for entry
 * is the client; direct connections fall back to a shared bucket, which is
 * fine — it only means stricter limiting, never looser.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Test seam. */
export function resetRateLimits() {
  buckets.clear();
}
