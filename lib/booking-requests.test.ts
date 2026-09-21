import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bookingResponseUrl,
  createBookingRequest,
  getBookingRequest,
  hasDurableBookingStorage,
  saveBookingRequest,
  withBookingLock,
} from "./booking-requests";
import { emptyPicker, type ContactPayload } from "./types";

const payload: ContactPayload = {
  formType: "appointment",
  name: "Ruth Alvarez",
  replyChannel: "text",
  phone: "(650) 555-0147",
  services: ["Haircut"],
  primary: { ...emptyPicker, date: "2026-09-23", slots: [600] },
  notes: "",
  question: "",
  company: "",
  elapsedMs: 20_000,
};

describe("durable Redis credentials", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays local when Upstash and Marketplace KV vars are blank", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    expect(hasDurableBookingStorage()).toBe(false);
  });

  it("uses Vercel Marketplace KV_REST_API_* credentials", () => {
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "example-token");
    expect(hasDurableBookingStorage()).toBe(true);
  });
});

describe("local booking request storage", () => {
  it("creates an unguessable request and persists its decision", async () => {
    const record = await createBookingRequest(payload);
    expect(record.token).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect((await getBookingRequest(record.token))?.status).toBe("pending");

    record.status = "completed";
    record.decision = {
      kind: "confirmed",
      time: "3:30 PM",
      sentAt: new Date().toISOString(),
    };
    await saveBookingRequest(record);
    expect((await getBookingRequest(record.token))?.decision).toEqual(
      record.decision,
    );
  });

  it("serializes concurrent changes to one request", async () => {
    const record = await createBookingRequest(payload);
    await withBookingLock(record.token, async () => {
      await expect(
        withBookingLock(record.token, async () => "no"),
      ).rejects.toThrow("BOOKING_BUSY");
    });
  });

  it("uses the request origin for a local confirmation link", async () => {
    const record = await createBookingRequest(payload);
    expect(
      bookingResponseUrl(
        new Request("http://localhost:3000/api/contact"),
        record.token,
      ),
    ).toBe(`http://localhost:3000/kim/${record.token}`);
  });
});
