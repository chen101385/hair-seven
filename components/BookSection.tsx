"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import type { AvailableDay } from "@/lib/hours";
import { AppointmentForm } from "./AppointmentForm";
import { QuestionForm } from "./QuestionForm";
import { CheckIcon } from "./icons";

type Tab = "appointment" | "question";

const TABS: { key: Tab; label: string }[] = [
  { key: "appointment", label: "Request an appointment" },
  { key: "question", label: "Ask a question" },
];

/**
 * Two forms, one card. Toggling swaps the fields without a page reload — and
 * without moving the toggle itself, so nothing jumps out from under the cursor.
 *
 * Both panels stay mounted, so switching over to ask a question and switching
 * back doesn't throw away what someone already typed.
 */
export function BookSection({ days }: { days: AvailableDay[] }) {
  const [tab, setTab] = useState<Tab>("appointment");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    appointment: null,
    question: null,
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next: Tab = tab === "appointment" ? "question" : "appointment";
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="book" className="bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h2>Book with Kim</h2>
        <p className="mt-3">
          Send a request and Kim will get back to you herself. If you’d rather
          just talk to her,{" "}
          <a
            href={`tel:${site.phoneHref}`}
            className="font-semibold underline underline-offset-4"
          >
            call {site.phone}
          </a>
          .
        </p>

        <div
          role="tablist"
          aria-label="Choose what to send"
          className="mt-6 grid gap-3 sm:grid-cols-2"
          onKeyDown={handleKeyDown}
        >
          {TABS.map(({ key, label }) => {
            const selected = tab === key;
            return (
              <button
                key={key}
                ref={(element) => {
                  tabRefs.current[key] = element;
                }}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={selected}
                aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className={`btn min-h-14 ${
                  selected ? "btn-primary" : "btn-secondary"
                }`}
              >
                {selected ? <CheckIcon className="h-5 w-5 shrink-0" /> : null}
                {label}
              </button>
            );
          })}
        </div>

        {/* The appointment card: paper, a brass rule under the hand-titled
            header, and half a degree of tilt that straightens as you fill it in. */}
        <div className="card card-tilt mt-6 p-5 sm:p-7">
          <Panel
            tab="appointment"
            active={tab === "appointment"}
            title="Request an appointment"
          >
            <AppointmentForm days={days} />
          </Panel>

          <Panel tab="question" active={tab === "question"} title="Ask a question">
            <QuestionForm />
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Panel({
  tab,
  active,
  title,
  children,
}: {
  tab: Tab;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${tab}`}
      aria-labelledby={`tab-${tab}`}
      hidden={!active}
    >
      <h3 className="card-rule pb-2">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}
