"use client";

import type { ReplyChannel } from "@/lib/types";
import { formatPhoneInput } from "@/lib/validate";
import { Field, FieldError, describedBy } from "./Field";
import { ChatIcon, MailIcon } from "./icons";

/**
 * The reply-channel choice reveals exactly one contact field. Don't show both
 * and don't ask for both — halving the fields halves the abandonment for this
 * audience.
 */
export function ReplyChannelFields({
  id,
  channel,
  phone,
  email,
  errors,
  onChannelChange,
  onPhoneChange,
  onEmailChange,
  onBlurField,
}: {
  id: string;
  channel: ReplyChannel | null;
  phone: string;
  email: string;
  errors: Record<string, string>;
  onChannelChange: (next: ReplyChannel) => void;
  onPhoneChange: (next: string) => void;
  onEmailChange: (next: string) => void;
  onBlurField: (field: "phone" | "email") => void;
}) {
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 font-semibold">
          How should Kim get back to you?
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChannelCard
            id={`${id}-channel-text`}
            name={`${id}-channel`}
            checked={channel === "text"}
            onSelect={() => onChannelChange("text")}
            icon={<ChatIcon />}
            title="Text me"
            /* True, reassuring, and it heads off the "will I get spammed"
               hesitation that stops older visitors from giving out a mobile. */
            detail="Kim will text you back herself from her own phone. You won’t get automated messages."
          />
          <ChannelCard
            id={`${id}-channel-email`}
            name={`${id}-channel`}
            checked={channel === "email"}
            onSelect={() => onChannelChange("email")}
            icon={<MailIcon />}
            title="Email me"
            detail="Kim will write back herself from her own email. No mailing list, ever."
          />
        </div>

        <FieldError id={`${id}-replyChannel`} error={errors.replyChannel} />
      </fieldset>

      {channel === "text" ? (
        <Field
          id={`${id}-phone`}
          label="Your mobile number"
          error={errors.phone}
        >
          <input
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(650) 555-0123"
            maxLength={14}
            className="field-input"
            value={phone}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy(`${id}-phone`, false, Boolean(errors.phone))}
            // Formats as they type — the field always reads (650) 949-0796.
            onChange={(event) => onPhoneChange(formatPhoneInput(event.target.value))}
            onBlur={() => onBlurField("phone")}
          />
        </Field>
      ) : null}

      {channel === "email" ? (
        <Field id={`${id}-email`} label="Your email" error={errors.email}>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="field-input"
            value={email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(`${id}-email`, false, Boolean(errors.email))}
            onChange={(event) => onEmailChange(event.target.value)}
            // Checked when they leave the field, not only at submit.
            onBlur={() => onBlurField("email")}
          />
        </Field>
      ) : null}
    </div>
  );
}

function ChannelCard({
  id,
  name,
  checked,
  onSelect,
  icon,
  title,
  detail,
}: {
  id: string;
  name: string;
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    // `relative` keeps the sr-only (position:absolute) radio anchored here
    // rather than to whatever positioned ancestor happens to be above it.
    <div className="relative">
      <input
        type="radio"
        id={id}
        name={name}
        className="choice-input sr-only"
        checked={checked}
        onChange={onSelect}
      />
      <label htmlFor={id} className="choice choice-channel h-full">
        <span className="flex items-center gap-2 text-[1.1875rem]">
          {icon}
          {title}
        </span>
        <span className="text-small font-normal">{detail}</span>
      </label>
    </div>
  );
}
