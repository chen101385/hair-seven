"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CheckIcon } from "./icons";

/**
 * Shown in place of the form once it's sent. Focus moves here so a screen
 * reader announces the outcome instead of leaving the visitor wondering
 * whether anything happened.
 */
export function Confirmation({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="flex items-center gap-3 outline-none"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-awning text-paper">
          <CheckIcon className="h-6 w-6" />
        </span>
        {heading}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
