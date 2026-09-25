"use client";

import { useState } from "react";
import type { KimOfferDay } from "@/lib/hours";
import type {
  AlternativeWindow,
  BookingDecision,
} from "@/lib/booking-requests";
import { CheckIcon } from "@/components/icons";

type RequestSummary = {
  name: string;
  phone: string;
  replyPreference: string;
  services: string[];
  day: string;
  windows: string[];
  notes: string;
};

export function KimDecision({
  token,
  status,
  decision,
  request,
  exactTimes,
  offerDays,
}: {
  token: string;
  status: "pending" | "completed";
  decision?: BookingDecision;
  request: RequestSummary;
  exactTimes: { value: string; label: string }[];
  offerDays: KimOfferDay[];
}) {
  const [mode, setMode] = useState<"confirm" | "alternatives" | null>(null);
  const [exactTime, setExactTime] = useState("");
  const [alternatives, setAlternatives] = useState<AlternativeWindow[]>([]);
  const [offerDate, setOfferDate] = useState(offerDays[0]?.date ?? "");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(
    status === "completed"
      ? completedMessage(decision)
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  const chooseAlternative = (option: AlternativeWindow) => {
    const selected = alternatives.some(
      (current) =>
        current.date === option.date && current.start === option.start,
    );
    if (selected) {
      setAlternatives((current) =>
        current.filter(
          (item) =>
            item.date !== option.date || item.start !== option.start,
        ),
      );
    } else if (alternatives.length < 3) {
      setAlternatives((current) => [...current, option]);
    }
  };

  const sendDecision = async () => {
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/kim/requests/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "confirm"
            ? { action: "confirm", time: exactTime }
            : { action: "alternatives", options: alternatives },
        ),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "That did not send.");
      }
      setResult(data.message || "The customer was notified.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "That did not send. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <div className="kim-card text-center" role="status">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-awning text-paper">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-[2rem]">Customer notified</h1>
        <p className="mt-3 text-[1.25rem]">{result}</p>
        <p className="mt-5 text-ink/75">You can close this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="kim-card">
        <p className="text-small font-semibold uppercase tracking-wide text-awning">
          Appointment request
        </p>
        <h1 className="mt-1 text-[2rem]">{request.name}</h1>
        <dl className="mt-5 space-y-3 text-[1.125rem]">
          <Summary label="Services" values={request.services} fallback="Not sure" />
          <Summary label="Requested day" values={[request.day]} />
          <Summary label="Times" values={request.windows} />
          {request.notes ? (
            <Summary label="Notes" values={[request.notes]} />
          ) : null}
          <Summary label="Customer phone" values={[request.phone]} />
          <Summary label="Prefers" values={[request.replyPreference]} />
        </dl>
      </section>

      {!mode ? (
        <section className="kim-card">
          <h2 className="text-center">Can you take this appointment?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="kim-action kim-action-yes"
              onClick={() => setMode("confirm")}
            >
              Yes
              <span>I have a time</span>
            </button>
            <button
              type="button"
              className="kim-action"
              onClick={() => setMode("alternatives")}
            >
              No
              <span>Suggest another time</span>
            </button>
          </div>
        </section>
      ) : null}

      {mode === "confirm" ? (
        <section className="kim-card">
          <button type="button" className="kim-back" onClick={() => setMode(null)}>
            ← Back
          </button>
          <h2 className="mt-3">Choose the exact time</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {exactTimes.map((time) => (
              <button
                key={time.value}
                type="button"
                className={`kim-choice ${
                  exactTime === time.value ? "kim-choice-selected" : ""
                }`}
                onClick={() => setExactTime(time.value)}
              >
                {time.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary mt-6 min-h-14 w-full text-[1.25rem]"
            disabled={!exactTime || sending}
            onClick={sendDecision}
          >
            {sending ? "Sending…" : "Confirm and text customer"}
          </button>
        </section>
      ) : null}

      {mode === "alternatives" ? (
        <AlternativePicker
          days={offerDays}
          selectedDate={offerDate}
          alternatives={alternatives}
          sending={sending}
          onSelectDate={setOfferDate}
          onToggleTime={chooseAlternative}
          onSend={sendDecision}
          onBack={() => setMode(null)}
        />
      ) : null}

      {error ? (
        <p className="rounded border-2 border-[#A12A1F] bg-[#FFF2F0] p-4 font-semibold text-[#A12A1F]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AlternativePicker({
  days,
  selectedDate,
  alternatives,
  sending,
  onSelectDate,
  onToggleTime,
  onSend,
  onBack,
}: {
  days: KimOfferDay[];
  selectedDate: string;
  alternatives: AlternativeWindow[];
  sending: boolean;
  onSelectDate: (date: string) => void;
  onToggleTime: (option: AlternativeWindow) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  const day = days.find((candidate) => candidate.date === selectedDate) ?? days[0];

  return (
    <section className="kim-card">
      <button type="button" className="kim-back" onClick={onBack}>
        ← Back
      </button>
      <h2 className="mt-3">Offer up to 3 times</h2>
      <p className="mt-1 text-ink/75">
        Pick a day, then the exact time. For example, tomorrow at 2:00 PM.
      </p>

      {alternatives.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {alternatives.map((option) => {
            const offerDay = days.find((candidate) => candidate.date === option.date);
            const time = offerDay?.times.find((slot) => slot.start === option.start);
            return (
              <li key={`${option.date}:${option.start}`}>
                <button
                  type="button"
                  className="kim-choice kim-choice-selected w-full text-left"
                  onClick={() => onToggleTime(option)}
                >
                  {offerDay?.heading ?? option.date} at {time?.label ?? "this time"}
                  <span className="mt-1 block text-small font-normal">
                    Tap to remove
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {day ? (
        <>
          <h3 className="mt-5 text-[1.25rem]">Which day?</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {days.map((candidate) => (
              <button
                key={candidate.date}
                type="button"
                className={`kim-choice ${
                  candidate.date === day.date ? "kim-choice-selected" : ""
                }`}
                onClick={() => onSelectDate(candidate.date)}
              >
                {candidate.heading}
              </button>
            ))}
          </div>

          <h3 className="mt-5 text-[1.25rem]">What time on {day.heading}?</h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {day.times.map((time) => {
              const selected = alternatives.some(
                (option) =>
                  option.date === day.date && option.start === time.start,
              );
              return (
                <button
                  key={time.start}
                  type="button"
                  className={`kim-choice ${selected ? "kim-choice-selected" : ""}`}
                  disabled={!selected && alternatives.length >= 3}
                  onClick={() =>
                    onToggleTime({ date: day.date, start: time.start })
                  }
                >
                  {time.label}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-4">No open days left to offer.</p>
      )}

      <p aria-live="polite" className="mt-5 font-semibold">
        {alternatives.length} of 3 selected
      </p>
      <button
        type="button"
        className="btn btn-primary mt-4 min-h-14 w-full text-[1.25rem]"
        disabled={alternatives.length === 0 || sending}
        onClick={onSend}
      >
        {sending ? "Sending…" : "Text these times"}
      </button>
    </section>
  );
}

function Summary({
  label,
  values,
  fallback,
}: {
  label: string;
  values: string[];
  fallback?: string;
}) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd>{values.length > 0 ? values.join(", ") : fallback}</dd>
    </div>
  );
}

function completedMessage(decision?: BookingDecision): string {
  if (!decision) return "This request has already been handled.";
  return decision.kind === "confirmed"
    ? `Confirmed for ${decision.time}.`
    : "Alternative times were sent.";
}
