/**
 * Spam control, part one: a field no human ever sees, positioned off-screen
 * rather than display:none, and out of the tab order. Anything that fills it in
 * is a bot. Part two is the minimum time-on-page check in the API route.
 *
 * Deliberately not a CAPTCHA — a CAPTCHA locks out exactly the people this
 * site exists for.
 */
export function Honeypot({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
    >
      <label htmlFor={`${id}-company`}>Company</label>
      <input
        id={`${id}-company`}
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
