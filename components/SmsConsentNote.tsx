"use client";

import Link from "next/link";
import { privacy } from "@/content/privacy";
import { smsProgram } from "@/content/sms-program";
import { terms } from "@/content/terms";
import type { ReplyChannel } from "@/lib/types";
import { FieldError, describedBy } from "./Field";

/**
 * Twilio toll-free verification wants this block visible at the point of
 * opt-in: an unchecked checkbox, message type, frequency, rates, HELP/STOP,
 * and links to Terms and Privacy.
 *
 * It renders whatever the reply channel is, so a carrier reviewer who only
 * loads the page still sees the disclosure. Checking it is required to be
 * texted, and choosing "Call me" leaves it optional rather than hiding it.
 */
export function SmsConsentNote({
  id,
  channel,
  checked,
  error,
  onChange,
}: {
  id: string;
  channel: ReplyChannel | null;
  checked: boolean;
  error?: string;
  onChange: (next: boolean) => void;
}) {
  const inputId = `${id}-smsConsent`;

  return (
    <div className="rounded-md border-2 border-ink/20 bg-white p-4">
      <div className="flex gap-3">
        <input
          id={inputId}
          type="checkbox"
          className="mt-1 h-6 w-6 shrink-0 accent-[var(--awning)]"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, true, Boolean(error))}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label htmlFor={inputId} className="text-small">
          {smsProgram.checkboxLabel}
        </label>
      </div>

      <div id={`${inputId}-hint`} className="mt-3 space-y-2 text-small text-ink/75">
        {channel === "call" ? <p>{smsProgram.callerNote}</p> : null}
        <p>
          <span className="font-semibold text-ink">Message frequency. </span>
          {smsProgram.frequency}
        </p>
        <p>
          <span className="font-semibold text-ink">Standard rates. </span>
          {smsProgram.rates}
        </p>
        <p>
          <span className="font-semibold text-ink">Help and Stop. </span>
          {smsProgram.helpStop}
        </p>
        <p>{smsProgram.noShare}</p>
        <p>
          <Link
            href={terms.path}
            className="font-semibold underline underline-offset-4"
          >
            Terms of Service
          </Link>
          {" | "}
          <Link
            href={privacy.path}
            className="font-semibold underline underline-offset-4"
          >
            Privacy Policy
          </Link>
        </p>
      </div>

      <FieldError id={inputId} error={error} />
    </div>
  );
}
