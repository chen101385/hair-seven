"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AvailableDay } from "@/lib/hours";
import { formatTime12 } from "@/lib/hours";
import type { PickerValue } from "@/lib/types";
import { FieldError } from "./Field";
import { ArrowIcon, CheckIcon } from "./icons";

/**
 * Buttons, not a calendar widget. No native datetime-local, no date library UI.
 * Step 1 picks a day from a row of large cards; step 2 picks a time from a
 * wrapped grid generated from that day's hours in content/site.ts.
 *
 * Closed days never reach this component — getAvailableDays() has already
 * dropped them, along with blacked-out dates and anything inside the lead time.
 */
export function DayTimePicker({
  id,
  days,
  value,
  onChange,
  error,
  allowFlexible = false,
}: {
  id: string;
  days: AvailableDay[];
  value: PickerValue;
  onChange: (next: PickerValue) => void;
  error?: string;
  allowFlexible?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const selectedDay = days.find((day) => day.date === value.date) ?? null;

  const syncArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    syncArrows();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [syncArrows, value.flexible, days.length]);

  const scrollDays = (direction: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (days.length === 0) {
    return (
      <div>
        <p className="font-semibold">
          There are no open times to show right now.
        </p>
        <p className="mt-1">
          Please call the salon and Kim will find you a time.
        </p>
      </div>
    );
  }

  return (
    // tabIndex -1 so a failed submit can move focus here and land the visitor
    // on the picker itself rather than somewhere in the middle of 15 radios.
    <div
      id={id}
      tabIndex={-1}
      role="group"
      aria-describedby={error ? `${id}-error` : undefined}
      className="outline-none"
    >
      {value.flexible ? (
        <div>
          <label htmlFor={`${id}-flexible-text`} className="block font-semibold">
            When would suit you?
          </label>
          <p
            id={`${id}-flexible-text-hint`}
            className="text-small text-ink/75 mt-1 mb-2"
          >
            In your own words — for example, “mornings, any day next week.”
          </p>
          <textarea
            id={`${id}-flexible-text`}
            aria-describedby={`${id}-flexible-text-hint`}
            className="field-input"
            rows={3}
            value={value.flexibleText}
            onChange={(event) =>
              onChange({ ...value, flexibleText: event.target.value })
            }
          />
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => onChange({ ...value, flexible: false })}
          >
            Pick a day and time instead
          </button>
        </div>
      ) : (
        <>
          {/* Step 1 — pick a day */}
          <p id={`${id}-day-label`} className="font-semibold">
            Step 1 — pick a day
          </p>

          <div className="mt-2 flex items-stretch gap-2">
            <ScrollArrow
              direction="left"
              label="Show earlier days"
              disabled={atStart}
              onClick={() => scrollDays(-1)}
            />

            <div
              ref={scroller}
              role="radiogroup"
              aria-labelledby={`${id}-day-label`}
              className="relative flex min-w-0 flex-1 gap-3 overflow-x-auto px-0.5 py-1"
            >
              {days.map((day) => {
                const inputId = `${id}-day-${day.date}`;
                return (
                  // `relative` matters: the radio below is sr-only, which is
                  // position:absolute. Without a positioned wrapper its
                  // containing block is the <form>, so it escapes this
                  // scroller's clipping and drags the whole page ~1600px wide.
                  <div key={day.date} className="relative shrink-0">
                    <input
                      type="radio"
                      id={inputId}
                      name={`${id}-day`}
                      className="choice-input sr-only"
                      checked={value.date === day.date}
                      onChange={() =>
                        // Changing the day always clears the time — the old one
                        // may not even exist on the new day.
                        onChange({ ...value, date: day.date, slot: null })
                      }
                    />
                    <label htmlFor={inputId} className="choice choice-day">
                      <CheckIcon className="choice-check h-5 w-5" />
                      <span className="text-small tracking-wide">
                        {day.weekdayShort}
                      </span>
                      <span className="font-display text-[1.25rem]">
                        {day.dateLabel}
                      </span>
                      <span className="text-small font-normal">
                        {day.hoursLabel}
                      </span>
                      <span className="sr-only">{day.weekdayLong}</span>
                    </label>
                  </div>
                );
              })}
            </div>

            <ScrollArrow
              direction="right"
              label="Show later days"
              disabled={atEnd}
              onClick={() => scrollDays(1)}
            />
          </div>

          {/* Step 2 — pick a time */}
          {selectedDay ? (
            <div className="mt-6">
              <p id={`${id}-time-label`} className="font-semibold">
                Step 2 — pick a time on {selectedDay.fullLabel}
              </p>
              <div
                role="radiogroup"
                aria-labelledby={`${id}-time-label`}
                className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              >
                {selectedDay.slots.map((slot) => {
                  const inputId = `${id}-time-${slot}`;
                  return (
                    <div key={slot} className="relative">
                      <input
                        type="radio"
                        id={inputId}
                        name={`${id}-time`}
                        className="choice-input sr-only"
                        checked={value.slot === slot}
                        onChange={() => onChange({ ...value, slot })}
                      />
                      <label htmlFor={inputId} className="choice choice-time">
                        <CheckIcon className="choice-check h-4 w-4" />
                        {formatTime12(slot)}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {allowFlexible ? (
            <button
              type="button"
              className="btn btn-secondary mt-6 w-full sm:w-auto"
              onClick={() =>
                onChange({ ...value, flexible: true, date: null, slot: null })
              }
            >
              I’m flexible / none of these work
            </button>
          ) : null}
        </>
      )}

      <FieldError id={id} error={error} />
    </div>
  );
}

function ScrollArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="btn btn-secondary min-w-12 shrink-0 self-stretch px-0"
    >
      <ArrowIcon direction={direction} />
    </button>
  );
}
