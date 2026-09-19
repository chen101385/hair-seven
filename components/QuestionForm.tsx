"use client";

import { useCallback } from "react";
import { site } from "@/content/site";
import { MAX_QUESTION_LENGTH } from "@/lib/types";
import { Confirmation } from "./Confirmation";
import { Field, describedBy } from "./Field";
import { Honeypot } from "./Honeypot";
import { ReplyChannelFields } from "./ReplyChannelFields";
import { SubmitError } from "./SubmitError";
import { emptyPayload, useContactForm } from "./useContactForm";

const ID = "ask";
const FIELD_ORDER = ["name", "replyChannel", "phone", "question"];

/** Deliberately short. No date picker, no service list. */
export function QuestionForm() {
  const focusTargetFor = useCallback((field: string) => {
    switch (field) {
      case "name":
        return `${ID}-name`;
      case "replyChannel":
        return `${ID}-channel-text`;
      case "phone":
        return `${ID}-phone`;
      case "question":
        return `${ID}-question`;
      default:
        return null;
    }
  }, []);

  const { values, set, checkOnBlur, errors, status, submitError, confirmed, submit } =
    useContactForm({
      initial: emptyPayload("question"),
      fieldOrder: FIELD_ORDER,
      focusTargetFor,
    });

  if (confirmed) {
    return (
      <Confirmation heading="Message sent.">
        <p>Kim usually replies within a day or two.</p>
        <p className="mt-4">
          Need an answer sooner?{" "}
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

      <ReplyChannelFields
        id={ID}
        channel={values.replyChannel}
        phone={values.phone}
        errors={errors}
        onChannelChange={(next) => set("replyChannel", next)}
        onPhoneChange={(next) => set("phone", next)}
        onBlurField={checkOnBlur}
      />

      <Field id={`${ID}-question`} label="Your question" error={errors.question}>
        <textarea
          id={`${ID}-question`}
          rows={4}
          maxLength={MAX_QUESTION_LENGTH}
          className="field-input"
          value={values.question}
          aria-invalid={errors.question ? true : undefined}
          aria-describedby={describedBy(
            `${ID}-question`,
            false,
            Boolean(errors.question),
          )}
          onChange={(event) => set("question", event.target.value)}
        />
      </Field>

      <SubmitError message={submitError} />

      <div>
        <button
          type="submit"
          className="btn btn-primary min-h-14 w-full text-[1.25rem]"
          disabled={sending}
        >
          {sending ? "Sending…" : "Send message"}
        </button>

        <p className="mt-3">Kim usually replies within a day or two.</p>
        <p className="mt-2 text-small text-ink/75">
          Your information goes only to Kim. It isn’t shared or sold.
        </p>
      </div>
    </form>
  );
}
