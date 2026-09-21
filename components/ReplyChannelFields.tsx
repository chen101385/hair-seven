"use client";

import type { ReplyChannel } from "@/lib/types";
import { formatPhoneInput } from "@/lib/validate";
import { Field, FieldError, describedBy } from "./Field";
import { ChatIcon, PhoneIcon } from "./icons";

/**
 * Kim handles every follow-up herself by phone, so both choices share one
 * mobile-number field.
 */
export function ReplyChannelFields({
  id,
  channel,
  phone,
  errors,
  onChannelChange,
  onPhoneChange,
  onBlurField,
}: {
  id: string;
  channel: ReplyChannel | null;
  phone: string;
  errors: Record<string, string>;
  onChannelChange: (next: ReplyChannel) => void;
  onPhoneChange: (next: string) => void;
  onBlurField: (field: "phone") => void;
}) {
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 font-semibold">
          How should Kim contact you?
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
            detail="Kim will text you about this request. We don’t send marketing texts."
          />
          <ChannelCard
            id={`${id}-channel-call`}
            name={`${id}-channel`}
            checked={channel === "call"}
            onSelect={() => onChannelChange("call")}
            icon={<PhoneIcon />}
            title="Call me"
            detail="Kim will call you herself after checking her appointment book."
          />
        </div>

        <FieldError id={`${id}-replyChannel`} error={errors.replyChannel} />
      </fieldset>

      {channel ? (
        <Field
          id={`${id}-phone`}
          label={channel === "text" ? "Your mobile number" : "Your phone number"}
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
