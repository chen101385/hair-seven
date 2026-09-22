import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";
import { site } from "@/content/site";

export function LegalDocument({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: readonly { heading: string; paragraphs: readonly string[] }[];
}) {
  return (
    <>
      <Header />
      <main className="bg-paper">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-small text-ink/75">
            <Link href="/" className="font-semibold underline underline-offset-4">
              {site.name}
            </Link>
          </p>
          <h1 className="mt-3">{title}</h1>
          <p className="mt-3 text-small text-ink/75">Last updated {updated}</p>

          {sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2 className="text-[1.5rem]">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
