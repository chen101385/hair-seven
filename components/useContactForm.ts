"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContactPayload, ContactResponse } from "@/lib/types";
import { validateContact } from "@/lib/validate";

export type FormStatus = "idle" | "sending" | "done";

/**
 * Submission behaviour shared by both forms.
 *
 * The one rule that matters here: nothing a visitor typed is ever cleared.
 * `values` is only ever written by the visitor, so an error — client-side,
 * server-side, or a dropped connection — leaves every field, and the picker
 * selection, exactly as they left it.
 */
export function useContactForm({
  initial,
  fieldOrder,
  focusTargetFor,
}: {
  initial: ContactPayload;
  /** Visual top-to-bottom order, used to focus the *first* problem. */
  fieldOrder: string[];
  /** Maps an error key to the DOM id that should receive focus. */
  focusTargetFor: (field: string) => string | null;
}) {
  const [values, setValues] = useState<ContactPayload>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ContactPayload | null>(null);

  // Minimum time-on-page check. Set on mount so it measures the real visit.
  const mountedAt = useRef(0);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const set = useCallback(
    <K extends keyof ContactPayload>(key: K, value: ContactPayload[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      // Clear that field's error as soon as they start fixing it.
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    },
    [],
  );

  /**
   * Check one field when the visitor leaves it, so a mistyped email or phone
   * is caught right there instead of at submit time.
   *
   * Only fires when the field has something in it. Tabbing past an empty field
   * you haven't reached yet shouldn't scold you — that's submit's job.
   */
  const checkOnBlur = useCallback(
    (field: keyof ContactPayload & string) => {
      const current = values[field];
      if (typeof current === "string" && current.trim() === "") return;

      const found = validateContact(values);
      setErrors((prev) => {
        const next = { ...prev };
        if (found[field]) next[field] = found[field];
        else delete next[field];
        return next;
      });
    },
    [values],
  );

  const focusFirstError = useCallback(
    (found: Record<string, string>) => {
      const field = fieldOrder.find((name) => found[name]);
      if (!field) return;
      const target = focusTargetFor(field);
      if (!target) return;
      const element = document.getElementById(target);
      if (!element) return;
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      element.focus({ preventScroll: true });
    },
    [fieldOrder, focusTargetFor],
  );

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const found = validateContact(values);
      setSubmitError(null);
      setErrors(found);
      if (Object.keys(found).length > 0) {
        focusFirstError(found);
        return;
      }

      setStatus("sending");
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            elapsedMs: Date.now() - mountedAt.current,
          }),
        });
        const data = (await response.json()) as ContactResponse;

        if (!data.ok) {
          setErrors(data.fieldErrors ?? {});
          setSubmitError(data.message);
          setStatus("idle");
          if (data.fieldErrors) focusFirstError(data.fieldErrors);
          return;
        }

        setConfirmed(values);
        setStatus("done");
      } catch {
        setSubmitError(
          "Sorry — that didn’t send. Please check your connection and try again, or call the salon.",
        );
        setStatus("idle");
      }
    },
    [values, focusFirstError],
  );

  return {
    values,
    set,
    checkOnBlur,
    errors,
    status,
    submitError,
    confirmed,
    submit,
  };
}

/** The base payload both forms start from. */
export function emptyPayload(
  formType: ContactPayload["formType"],
): ContactPayload {
  return {
    formType,
    name: "",
    replyChannel: null,
    phone: "",
    email: "",
    service: "",
    primary: { date: null, slots: [], flexible: false, flexibleText: "" },
    notes: "",
    question: "",
    company: "",
    elapsedMs: 0,
  };
}
