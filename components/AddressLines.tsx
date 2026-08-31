import { site } from "@/content/site";

/**
 * The address renders in three places — hero, Hours section, footer — so the
 * formatting lives here rather than being retyped and drifting apart.
 *
 *   1040 Grant Rd, Ste 150
 *   Inside Beauty Plaza
 *   Mountain View, CA 94040
 */
export function AddressLines({ className = "" }: { className?: string }) {
  const { street, place, city, state, zip } = site.address;

  return (
    <span className={className}>
      {street}
      <br />
      {place ? (
        <>
          {place}
          <br />
        </>
      ) : null}
      {city}, {state} {zip}
    </span>
  );
}

/** Single-line form, for tight spots. */
export function addressOneLine() {
  const { street, place, city, state, zip } = site.address;
  return [street, place, `${city}, ${state} ${zip}`].filter(Boolean).join(" · ");
}
