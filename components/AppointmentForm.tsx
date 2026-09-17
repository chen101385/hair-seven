"use client";

import { useCallback } from "react";
import { site } from "@/content/site";
import type { AvailableDay } from "@/lib/hours";
import { describeDay, describeTimes } from "@/lib/hours";
import { appointmentSmsRemaining } from "@/lib/sms";
import { MAX_NOTES_LENGTH, type ContactPayload } from "@/lib/types";
import { formatPhone } from "@/lib/validate";
import { Confirmation } from "./Confirmation";
import { DayTimePicker } from "./DayTimePicker";
import { Field, describedBy } from "./Field";
import { Honeypot } from "./Honeypot";
import { ReplyChannelFields } from "./ReplyChannelFields";
import { SubmitError } from "./SubmitError";
import { emptyPayload, useContactForm } from "./useContactForm";

const ID = "appt";

/** Visual top-to-bottom order, so a failed submit lands on the first problem. */
const FIELD_ORDER = ["name", "primary", "replyChannel", "phone"];

/**
 * This is a request, not a live booking. Nothing here may imply an instant
 * confirmation — the worst outcome for this site is someone showing up
 * Thursday at 2 because a website let them click a button.
 */
export function AppointmentForm({ days }: { days: AvailableDay[] }) {
  const focusTargetFor = useCallback((field: string) => {
    switch (field) {
      case "name":
        return `${ID}-name`;
      case "primary":
        return `${ID}-primary`;
      case "replyChannel":
        return `${ID}-channel-text`;
      case "phone":
        return `${ID}-phone`;
      default:
        return null;
    }
  }, []);

  const { values, set, checkOnBlur, errors, status, submitError, confirmed, submit } =
    useContactForm({
      initial: emptyPayload("appointment"),
      fieldOrder: FIELD_ORDER,
      focusTargetFor,
    });

  if (confirmed) return <AppointmentConfirmation values={confirmed} />;

  const sending = status === "sending";
  const noteLimit = appointmentSmsRemaining(values);
  const notesRemainingId = `${ID}-notes-remaining`;

  return (
    <form onSubmit={submit} noValidate className="relative space-y-6">
      <Honeypot id={ID} value={values.company} onChange={(v) => set("company", v)} />

      <Field id={`${ID}-name`} label="Your name" error={errors.name}>
        <input
          id={`${ID}-name`}
          type="text"
          autoComplete="name"
          className="field-input"
          value={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(`${ID}-name`, false, Boolean(errors.name))}
          onChange={(event) => set("name", event.target.value)}
        />
      </Field>

      <Field id={`${ID}-service`} label="Service you’d like" optional>
        <select
          id={`${ID}-service`}
          className="field-input"
          value={values.service}
          onChange={(event) => set("service", event.target.value)}
        >
          <option value="">Not sure yet</option>
          {site.services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="font-semibold">Day and time</legend>
        {/* Said plainly, above the picker — and again under the button. */}
        <p className="mt-1 mb-4">
          Pick a day, then choose every time window that works for you. This
          isn’t a live calendar — Kim will call or text within{" "}
          {site.booking.replyWindow} to confirm the exact time.
        </p>
        <DayTimePicker
          id={`${ID}-primary`}
          days={days}
          value={values.primary}
          onChange={(next) => set("primary", next)}
          error={errors.primary}
        />
      </fieldset>

      <ReplyChannelFields
        id={ID}
        channel={values.replyChannel}
        phone={values.phone}
        errors={errors}
        onChannelChange={(next) => set("replyChannel", next)}
        onPhoneChange={(next) => set("phone", next)}
        onBlurField={checkOnBlur}
      />

      <Field
        id={`${ID}-notes`}
        label="Anything else she should know"
        optional
        hint="Optional timing notes. The request stays one text unless this note runs long."
      >
        <textarea
          id={`${ID}-notes`}
          rows={3}
          maxLength={MAX_NOTES_LENGTH}
          className="field-input"
          value={values.notes}
          aria-describedby={describedBy(`${ID}-notes`, true, false, notesRemainingId)}
          onChange={(event) => set("notes", event.target.value)}
        />
        <p
          id={notesRemainingId}
          aria-live="polite"
          className="text-small text-ink/75 mt-2"
        >
          {noteLimit.secondText
            ? `Second text · ${noteLimit.remaining} ${
                noteLimit.remaining === 1 ? "character" : "characters"
              } remaining`
            : `${noteLimit.remaining} ${
                noteLimit.remaining === 1 ? "character" : "characters"
              } remaining`}
        </p>
      </Field>

      <SubmitError message={submitError} />

      <div>
        <button
          type="submit"
          className="btn btn-primary min-h-14 w-full text-[1.25rem]"
          disabled={sending}
        >
          {sending ? "Sending…" : "Send request"}
        </button>

        <p className="mt-3">
          Nothing is booked yet. Kim will call or text within{" "}
          {site.booking.replyWindow} to confirm the exact appointment time.
        </p>
        <p className="mt-2 text-small text-ink/75">
          Your information goes only to Kim. It isn’t shared or sold.
        </p>
      </div>
    </form>
  );
}

function AppointmentConfirmation({ values }: { values: ContactPayload }) {
  const byText = values.replyChannel === "text";

  return (
    <Confirmation heading="Request received.">
      <p>
        Kim will check her appointment book, then call or text within{" "}
        {site.booking.replyWindow} to confirm the exact time. Nothing is booked
        until she does.
      </p>

      <dl className="mt-5 space-y-3">
        <div>
          <dt className="font-semibold">Day</dt>
          <dd>{describeDay(values.primary)}</dd>
        </div>
        <div>
          <dt className="font-semibold">
            {values.primary.slots.length === 1
              ? "Window that works for you"
              : "Windows that work for you"}
          </dt>
          <dd>{describeTimes(values.primary)}</dd>
        </div>
        <div>
          <dt className="font-semibold">She’ll get back to you</dt>
          <dd>
            {byText ? "By text" : "By phone"}, at {formatPhone(values.phone)}
          </dd>
        </div>
      </dl>

      <p className="mt-5">
        Need it sooner?{" "}
        <a
          href={`tel:${site.phoneHref}`}
          className="font-semibold underline underline-offset-4"
        >
          Call {site.phone}
        </a>
        .
      </p>
    </Confirmation>
  );
}
