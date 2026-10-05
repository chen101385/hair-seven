"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Day = { date: string; heading: string };

export function ClosedDays({
  signedIn,
  days,
  closed,
}: {
  signedIn: boolean;
  days: Day[];
  closed: string[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"ask" | "enter" | "ready">(
    signedIn ? "ready" : "ask",
  );
  const [code, setCode] = useState("");
  const [closedDates, setClosedDates] = useState(closed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/closed/code", { method: "POST" });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "The code did not send.");
      }
      setPhase("enter");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code did not send.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/closed/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "That code is not right.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That code is not right.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (date: string) => {
    const nextClosed = !closedDates.includes(date);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/closed/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, closed: nextClosed }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string; closed?: string[] };
      if (!response.ok || !data.ok || !data.closed) {
        throw new Error(data.message || "That day did not save.");
      }
      setClosedDates(data.closed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That day did not save.");
    } finally {
      setBusy(false);
    }
  };

  if (phase !== "ready") {
    return (
      <div className="card p-6">
        <h1>Closed days</h1>
        <p className="mt-3">
          A code will be texted to the saved phone. Enter it to close days.
        </p>
        {phase === "ask" ? (
          <button
            type="button"
            className="btn btn-primary mt-6 min-h-14"
            disabled={busy}
            onClick={sendCode}
          >
            {busy ? "Sending…" : "Text me a code"}
          </button>
        ) : (
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              void verify();
            }}
          >
            <label htmlFor="closed-code" className="font-semibold">
              Code
            </label>
            <input
              id="closed-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="field-input mt-2"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary mt-4 min-h-14"
              disabled={busy || code.replace(/\D/g, "").length !== 6}
            >
              {busy ? "Checking…" : "Enter"}
            </button>
          </form>
        )}
        {error ? <p className="mt-4 font-semibold text-[#A12A1F]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h1>Closed days</h1>
      <p className="mt-3">Tap a day to close it. Tap again to open it.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {days.map((day) => {
          const isClosed = closedDates.includes(day.date);
          return (
            <button
              key={day.date}
              type="button"
              className={`kim-choice ${isClosed ? "kim-choice-selected" : ""}`}
              disabled={busy}
              onClick={() => void toggle(day.date)}
            >
              {day.heading}
              <span className="mt-1 block text-small font-normal">
                {isClosed ? "Closed" : "Open"}
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-4 font-semibold text-[#A12A1F]">{error}</p> : null}
    </div>
  );
}
