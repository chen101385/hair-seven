import { site } from "@/content/site";
import { PhoneIcon, PinIcon } from "./icons";

export function Hero() {
  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <h1>{site.name}</h1>

        <p className="mt-4 max-w-2xl text-[1.3rem]">{site.tagline}</p>

        <p className="mt-3 flex items-center gap-2 text-ink/75">
          <PinIcon className="h-5 w-5 shrink-0 text-brass" />
          {site.address.city}, {site.address.state}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={`tel:${site.phoneHref}`}
            className="btn btn-primary min-h-14 px-8 text-[1.25rem] sm:w-auto"
          >
            <PhoneIcon />
            Call Kim
          </a>
          <a
            href="#book"
            className="btn btn-secondary min-h-14 px-8 text-[1.25rem] sm:w-auto"
          >
            Request an appointment
          </a>
        </div>
      </div>
    </section>
  );
}
