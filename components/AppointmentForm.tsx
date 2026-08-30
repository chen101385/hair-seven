"use client";

import { useCallback } from "react";
import { site } from "@/content/site";
import type { AvailableDay } from "@/lib/hours";
import { describeSlot } from "@/lib/hours";
import type { ContactPayload } from "@/lib/types";
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
const FIELD_ORDER = ["name", "primary", "backup", "replyChannel", "phone", "email"];

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
      case "backup":
        return `${ID}-backup`;
      case "replyChannel":
        return `${ID}-channel-text`;
      case "phone":
        return `${ID}-phone`;
      case "email":
        return `${ID}-email`;
      default:
        return null;
    }
  }, []);

  const { values, set, errors, status, submitError, confirmed, submit } =
    useContactForm({
      initial: emptyPayload("appointment"),
      fieldOrder: FIELD_ORDER,
      focusTargetFor,
    });

  if (confirmed) return <AppointmentConfirmation values={confirmed} />;

  const sending = status === "sending";

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
          Pick a day and time you’d like. This isn’t a live calendar — Kim will
          confirm with you within {site.booking.replyWindow}.
        </p>
        <DayTimePicker
          id={`${ID}-primary`}
          days={days}
          value={values.primary}
          onChange={(next) => set("primary", next)}
          error={errors.primary}
          allowFlexible
        />
      </fieldset>

      {values.backupOpen ? (
        <fieldset>
          <legend className="font-semibold">
            Backup day and time
            <span className="font-normal text-ink/75"> (optional)</span>
          </legend>
          <p className="mt-1 mb-4">
            A second choice saves a round of phone tag.
          </p>
          <DayTimePicker
            id={`${ID}-backup`}
            days={days}
            value={values.backup}
            onChange={(next) => set("backup", next)}
            error={errors.backup}
          />
          <button
            type="button"
            className="btn btn-secondary mt-4"
            onClick={() => set("backupOpen", false)}
          >
            Remove backup time
          </button>
        </fieldset>
      ) : (
        <button
          type="button"
          className="btn btn-secondary w-full sm:w-auto"
          onClick={() => set("backupOpen", true)}
        >
          Add a backup time
        </button>
      )}

      <ReplyChannelFields
        id={ID}
        channel={values.replyChannel}
        phone={values.phone}
        email={values.email}
        errors={errors}
        onChannelChange={(next) => set("replyChannel", next)}
        onPhoneChange={(next) => set("phone", next)}
        onEmailChange={(next) => set("email", next)}
      />

      <Field
        id={`${ID}-notes`}
        label="Anything else she should know"
        optional
        hint="Allergies, a photo you want to bring, who referred you — anything helpful."
      >
        <textarea
          id={`${ID}-notes`}
          rows={3}
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
          {sending ? "Sending…" : "Send request"}
        </button>

        <p className="mt-3">
          This isn’t a live calendar. Kim will confirm your appointment with you
          within {site.booking.replyWindow}.
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
        Kim will confirm with you within {site.booking.replyWindow}. Nothing is
        booked until she does.
      </p>

      <dl className="mt-5 space-y-3">
        <div>
          <dt className="font-semibold">You asked for</dt>
          <dd>{describeSlot(values.primary)}</dd>
        </div>
        {values.backupOpen &&
        (values.backup.date || values.backup.flexible) ? (
          <div>
            <dt className="font-semibold">Backup</dt>
            <dd>{describeSlot(values.backup)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold">She’ll get back to you</dt>
          <dd>
            {byText
              ? `By text, at ${formatPhone(values.phone)}`
              : `By email, at ${values.email.trim()}`}
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
