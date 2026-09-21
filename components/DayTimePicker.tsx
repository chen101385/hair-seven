"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AvailableDay } from "@/lib/hours";
import { describeTimes } from "@/lib/hours";
import type { PickerValue } from "@/lib/types";
import { FieldError } from "./Field";
import { ArrowIcon, CheckIcon } from "./icons";

/**
 * Buttons, not a calendar widget. No native datetime-local, no date library UI.
 *
 * Step 1 picks one day. Step 2 lets the visitor tap every broad window that day
 * that would work for them — Kim keeps her appointment book on paper, so she
 * reads the list and confirms whichever one she actually has free. Picking
 * several is the normal case, not an advanced one, so the copy says so plainly
 * and a running summary shows what's been chosen.
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
}: {
  id: string;
  days: AvailableDay[];
  value: PickerValue;
  onChange: (next: PickerValue) => void;
  error?: string;
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
  }, [syncArrows, days.length]);

  const scrollDays = (direction: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const toggleSlot = (start: number) => {
    const slots = value.slots.includes(start)
      ? value.slots.filter((slot) => slot !== start)
      : [...value.slots, start].sort((a, b) => a - b);
    onChange({ ...value, slots });
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

  const count = value.slots.length;

  return (
    <div
      id={id}
      tabIndex={-1}
      role="group"
      aria-describedby={error ? `${id}-error` : undefined}
      className="outline-none"
    >
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
                    // Times belong to a day. Changing the day clears them.
                    onChange({ ...value, date: day.date, slots: [] })
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
                  <span className="text-small font-normal">{day.hoursLabel}</span>
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

      {selectedDay ? (
        <div className="mt-6">
          <p id={`${id}-time-label`} className="font-semibold">
            Step 2 — choose every time window that works on{" "}
            {selectedDay.fullLabel}
          </p>
          <p id={`${id}-time-hint`} className="mt-1 mb-2">
            Choose one, several, or all of the windows below. Kim will call or
            text you to confirm the exact appointment time.
          </p>

          <div
            role="group"
            aria-labelledby={`${id}-time-label`}
            aria-describedby={`${id}-time-hint`}
            className="grid gap-3 sm:grid-cols-3"
          >
            {selectedDay.slots.map((slot) => {
              const inputId = `${id}-time-${slot.start}`;
              return (
                <div key={slot.start} className="relative">
                  <input
                    type="checkbox"
                    id={inputId}
                    className="choice-input sr-only"
                    checked={value.slots.includes(slot.start)}
                    onChange={() => toggleSlot(slot.start)}
                  />
                  <label htmlFor={inputId} className="choice choice-time">
                    <CheckIcon className="choice-check h-4 w-4" />
                    <span className="flex flex-col">
                      <span>{slot.name}</span>
                      <span className="text-small font-normal">
                        {slot.timeLabel}
                      </span>
                    </span>
                  </label>
                </div>
              );
            })}
          </div>

          <div aria-live="polite" className="mt-4">
            {count > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded border-2 border-awning/35 bg-tint p-3">
                <p>
                  <span className="font-semibold">
                    You picked {count} {count === 1 ? "window" : "windows"}:
                  </span>{" "}
                  {describeTimes(value)}
                </p>
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => onChange({ ...value, slots: [] })}
                >
                  Clear times
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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
