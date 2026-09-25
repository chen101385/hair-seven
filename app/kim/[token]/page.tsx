import type { Metadata } from "next";
import { site } from "@/content/site";
import {
  formatFullDateLabel,
  formatTime12,
  generateAvailabilityWindows,
  getKimOfferDays,
  weekdayIndex,
} from "@/lib/hours";
import { getBookingRequest } from "@/lib/booking-requests";
import { KimDecision } from "./KimDecision";

export const metadata: Metadata = {
  title: `Review appointment — ${site.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function KimBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await getBookingRequest(token);

  if (!record) {
    return (
      <KimPageShell>
        <div className="kim-card text-center">
          <h1 className="text-[2rem]">This request has expired.</h1>
          <p className="mt-3">Please check the newest Hair 7 text message.</p>
        </div>
      </KimPageShell>
    );
  }

  const { payload } = record;
  const exactTimes = getExactTimes(payload.primary.date, payload.primary.slots);

  return (
    <KimPageShell>
      <KimDecision
        token={token}
        status={record.status}
        decision={record.decision}
        request={{
          name: payload.name,
          phone: payload.phone,
          replyPreference:
            payload.replyChannel === "call" ? "Call" : "Text",
          services: payload.services,
          day: payload.primary.date
            ? formatFullDateLabel(payload.primary.date)
            : "No day",
          windows: describeRequestedWindows(
            payload.primary.date,
            payload.primary.slots,
          ),
          notes: payload.notes,
        }}
        exactTimes={exactTimes}
        offerDays={getKimOfferDays()}
      />
    </KimPageShell>
  );
}

function KimPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="kim-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="mb-4 text-center font-display text-[1.5rem] font-semibold text-awning">
          Hair 7
        </p>
        {children}
      </div>
    </main>
  );
}

function getExactTimes(date: string | null, selectedStarts: number[]) {
  if (!date) return [];
  const hours = site.hours[weekdayIndex(date)];
  if (!hours?.open || !hours.close) return [];
  const windows = generateAvailabilityWindows(hours.open, hours.close).filter(
    (window) => selectedStarts.includes(window.start),
  );
  return windows.flatMap((window) => {
    const times: { value: string; label: string }[] = [];
    for (let time = window.start; time < window.end; time += 30) {
      const hours24 = Math.floor(time / 60);
      const minutes = time % 60;
      times.push({
        value: `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0",
        )}`,
        label: formatTime12(time),
      });
    }
    return times;
  });
}

function describeRequestedWindows(
  date: string | null,
  selectedStarts: number[],
): string[] {
  if (!date) return [];
  const hours = site.hours[weekdayIndex(date)];
  if (!hours?.open || !hours.close) return [];
  return generateAvailabilityWindows(hours.open, hours.close)
    .filter((window) => selectedStarts.includes(window.start))
    .map((window) => `${window.name} · ${window.timeLabel}`);
}
