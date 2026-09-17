import type { ReactNode } from "react";

/**
 * Label above the field, always visible. Never a placeholder-only label.
 * Optional fields are marked rather than required ones — most of this form is
 * required, and "(optional)" is the more useful signal.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-semibold mb-1.5">
        {label}
        {/* /75, not /65: at 65% this measures 4.4:1, just under the floor. */}
        {optional ? (
          <span className="font-normal text-ink/75"> (optional)</span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-small text-ink/75 mb-2">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}

/**
 * Errors sit directly below the field they belong to, in plain words.
 * The container is always rendered so appearing text doesn't shift the layout
 * of everything under it more than the one line it needs.
 */
export function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    <p
      id={`${id}-error`}
      role="alert"
      className={`text-small font-semibold text-[#A12A1F] ${error ? "mt-2" : "sr-only"}`}
    >
      {error ?? ""}
    </p>
  );
}

/** aria wiring for an input that may have a hint and/or an error attached. */
export function describedBy(
  id: string,
  hint: boolean,
  error: boolean,
  extra?: string,
) {
  const ids = [
    hint ? `${id}-hint` : null,
    extra ?? null,
    error ? `${id}-error` : null,
  ].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}
