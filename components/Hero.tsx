import Image from "next/image";
import { site } from "@/content/site";
import { AddressLines } from "./AddressLines";
import { PhoneIcon, PinIcon } from "./icons";

export function Hero() {
  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10">
          <div>
            <h1>{site.name}</h1>

            <p className="mt-4 max-w-2xl text-[1.3rem]">{site.tagline}</p>

            {/* Address at the top of the page as well as the bottom — half the
                people who land here are checking whether it's the salon they
                already go to. */}
            <address className="mt-4 flex gap-2 not-italic">
              <PinIcon className="mt-1 h-5 w-5 shrink-0 text-brass" />
              <AddressLines />
            </address>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${site.phoneHref}`}
                className="btn btn-primary min-h-14 px-8 text-[1.25rem] sm:w-auto"
              >
                <PhoneIcon />
                Call Kim
              </a>
              <a
                href="/#book"
                className="btn btn-secondary min-h-14 px-8 text-[1.25rem] sm:w-auto"
              >
                Request an appointment
              </a>
            </div>
          </div>

          <figure className="md:justify-self-end">
            <div className="border-2 border-brass/70 bg-white p-2">
              <Image
                src="/beauty-plaza-location.jpg"
                alt="Beauty Plaza storefront on Grant Road, where Hair 7 is located"
                width={818}
                height={956}
                sizes="(min-width: 768px) 28rem, 100vw"
                className="block h-auto w-full object-cover"
                priority
              />
            </div>
            <figcaption className="mt-3 text-center text-small text-ink/75">
              Hair 7 is located at the back right of the beauty store
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
