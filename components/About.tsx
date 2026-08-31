import Image from "next/image";
import { site } from "@/content/site";

export function About() {
  const { about } = site;

  return (
    <section id="about" className="bg-paper">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2>{about.heading}</h2>

        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-10">
          {/* Brass hardware on the mirror. */}
          <div className="border-2 border-brass/70 bg-white p-2">
            <Image
              src={about.photo}
              alt={about.photoAlt}
              width={1200}
              height={1600}
              sizes="(min-width: 768px) 20rem, 100vw"
              className="block h-auto w-full"
              priority={false}
            />
          </div>

          <div className="space-y-4">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* The one bit of the page that isn't about the salon. */}
        <div className="mt-10 flex items-center gap-4 border-t border-ink/15 pt-6 sm:gap-5">
          <div className="shrink-0 border-2 border-brass/70 bg-white p-1">
            <Image
              src={about.note.photo}
              alt={about.note.photoAlt}
              width={1200}
              height={1600}
              sizes="7rem"
              className="block h-[5.5rem] w-[4.5rem] object-cover object-top sm:h-[7rem] sm:w-[5.5rem]"
            />
          </div>
          <p className="text-small text-ink/75">{about.note.text}</p>
        </div>
      </div>
    </section>
  );
}
