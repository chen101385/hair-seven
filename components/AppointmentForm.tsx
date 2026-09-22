"use client";

import { useCallback } from "react";
import { site } from "@/content/site";
import type { AvailableDay } from "@/lib/hours";
import { describeDay, describeTimes } from "@/lib/hours";
import { MAX_NOTES_LENGTH, type ContactPayload } from "@/lib/types";
import { formatPhone } from "@/lib/validate";
import { Confirmation } from "./Confirmation";
import { DayTimePicker } from "./DayTimePicker";
import { Field, describedBy } from "./Field";
import { Honeypot } from "./Honeypot";
import { CheckIcon } from "./icons";
import { ReplyChannelFields } from "./ReplyChannelFields";
import { SmsConsentNote } from "./SmsConsentNote";
import { SubmitError } from "./SubmitError";
import { emptyPayload, useContactForm } from "./useContactForm";

const ID = "appt";

/** Visual top-to-bottom order, so a failed submit lands on the first problem. */
const FIELD_ORDER = ["name", "primary", "replyChannel", "phone", "smsConsent"];

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
      case "smsConsent":
        return `${ID}-smsConsent`;
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
  const notesRemaining = MAX_NOTES_LENGTH - values.notes.length;
  const toggleService = (service: string) => {
    const services = values.services.includes(service)
      ? values.services.filter((selected) => selected !== service)
      : [...values.services, service];
    set("services", services);
  };

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

      <fieldset>
        <legend className="font-semibold">
          Services you’d like{" "}
          <span className="font-normal text-ink/75">(optional)</span>
        </legend>
        <p id={`${ID}-services-hint`} className="text-small text-ink/75 mt-1 mb-2">
          Choose as many as you need, or leave this blank if you’re not sure.
        </p>
        <div
          className="grid gap-3 sm:grid-cols-2"
          aria-describedby={`${ID}-services-hint`}
        >
          {site.services.map((service) => (
            <div key={service.name} className="relative">
              <input
                type="checkbox"
                id={`${ID}-service-${service.name.replaceAll(" ", "-")}`}
                className="choice-input sr-only"
                checked={values.services.includes(service.name)}
                onChange={() => toggleService(service.name)}
              />
              <label
                htmlFor={`${ID}-service-${service.name.replaceAll(" ", "-")}`}
                className="choice choice-service"
              >
                <CheckIcon className="choice-check h-4 w-4" />
                {service.name}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

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
        onChannelChange={(next) => {
          set("replyChannel", next);
          set("smsConsent", false);
        }}
        onPhoneChange={(next) => set("phone", next)}
        onBlurField={checkOnBlur}
      />

      <SmsConsentNote
        id={ID}
        channel={values.replyChannel}
        checked={values.smsConsent}
        error={errors.smsConsent}
        onChange={(next) => set("smsConsent", next)}
      />

      <Field
        id={`${ID}-notes`}
        label="Anything else she should know"
        optional
        hint={
          <span aria-live="polite">
            {values.notes.length === 0
              ? `Specific timing notes or anything else Kim should know. ${MAX_NOTES_LENGTH} characters maximum.`
              : `${notesRemaining} ${
                  notesRemaining === 1 ? "character" : "characters"
                } remaining`}
          </span>
        }
      >
        <textarea
          id={`${ID}-notes`}
          rows={3}
          maxLength={MAX_NOTES_LENGTH}
          className="field-input"
          value={values.notes}
          aria-describedby={describedBy(`${ID}-notes`, true, false)}
          onChange={(event) => set("notes", event.target.value)}
        />
      </Field>

      <SubmitError message={submitError} />

      <div>
        <button
          type="submit"
          className="btn btn-primary min-h-14 w-full text-[1.25rem]"
          disabled={sending}
        >
          {sending
            ? "Sending…"
            : values.replyChannel === "text"
              ? "Yes, text me about this request"
              : "Send request"}
        </button>

        <p className="mt-3">
          Nothing is booked yet. Kim will call or text within{" "}
          {site.booking.replyWindow} to confirm the exact appointment time.
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
