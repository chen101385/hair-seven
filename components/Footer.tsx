import Link from "next/link";
import { privacy } from "@/content/privacy";
import { site } from "@/content/site";
import { terms } from "@/content/terms";
import { formatDayHours } from "@/lib/hours";
import { AddressLines } from "./AddressLines";
import { PhoneIcon, PinIcon } from "./icons";

export function Footer() {
  return (
    <footer className="on-awning bg-awning text-paper">
      <div className="awning-stripe" aria-hidden="true" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <p className="font-display text-[1.5rem] font-semibold">{site.name}</p>

        <div className="mt-6 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <h2 className="text-[1.125rem] font-semibold">Get in touch</h2>
            <ul className="mt-3 space-y-3">
              <li>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="inline-flex min-h-12 items-center gap-2 underline underline-offset-4"
                >
                  <PhoneIcon className="h-5 w-5 shrink-0" />
                  {site.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[1.125rem] font-semibold">Find us</h2>
            <address className="mt-3 flex gap-2 not-italic">
              <PinIcon className="mt-1 h-5 w-5 shrink-0" />
              <AddressLines />
            </address>
          </div>

          <div>
            <h2 className="text-[1.125rem] font-semibold">Hours</h2>
            <dl className="mt-3 space-y-1">
              {site.hours.map((day) => (
                <div key={day.day} className="flex justify-between gap-4">
                  <dt>{day.day}</dt>
                  <dd className="whitespace-nowrap text-paper/80">
                    {formatDayHours(day.open, day.close)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="mt-10 text-small text-paper/80">
          © {new Date().getFullYear()} {site.name}. {site.address.city},{" "}
          {site.address.state}.{" "}
          <Link
            href={terms.path}
            className="font-semibold underline underline-offset-4 text-paper"
          >
            Terms
          </Link>
          {" · "}
          <Link
            href={privacy.path}
            className="font-semibold underline underline-offset-4 text-paper"
          >
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}
