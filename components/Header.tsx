import { site } from "@/content/site";
import { PhoneIcon } from "./icons";

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About Kim" },
  { href: "#hours", label: "Hours" },
  { href: "#book", label: "Book" },
];

/**
 * Sticky, and the phone number is in it at every screen size. No hamburger:
 * on mobile the four section links wrap to two rows of full-width labeled
 * buttons. A menu this small has no business hiding behind an icon.
 */
export function Header() {
  return (
    <header className="on-awning sticky top-0 z-50 bg-awning text-paper">
      <a
        href="#book"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:rounded focus:bg-paper focus:px-4 focus:py-3 focus:font-semibold focus:text-awning-dark"
      >
        Skip to the booking form
      </a>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <a
            href="#top"
            className="font-display text-[1.25rem] font-semibold tracking-wide md:text-[1.5rem]"
          >
            {site.name}
          </a>

          {/* The single most important element on the page. */}
          <a
            href={`tel:${site.phoneHref}`}
            className="btn inline-flex bg-paper text-awning-dark border-2 border-paper px-3 md:px-5 whitespace-nowrap hover:bg-tint hover:border-tint"
          >
            <PhoneIcon />
            <span>{site.phone}</span>
            <span className="sr-only">— call the salon</span>
          </a>
        </div>

        <nav aria-label="Page sections" className="mt-2.5">
          <ul className="grid grid-cols-2 gap-3 md:flex md:gap-3">
            {NAV.map((item) => (
              <li key={item.href} className="md:flex-1">
                <a
                  href={item.href}
                  className="btn w-full border-2 border-paper/45 bg-white/10 text-paper hover:bg-white/20 hover:border-paper/70"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* The awning out front. */}
      <div className="awning-stripe" aria-hidden="true" />
    </header>
  );
}
