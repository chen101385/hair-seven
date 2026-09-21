import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";
import { privacy } from "@/content/privacy";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `${privacy.title} — ${site.name}`,
  description: `How ${site.name} collects phone numbers, sends appointment SMS, and honors opt-out. We do not share numbers for marketing.`,
  alternates: { canonical: privacy.path },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
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
          <h1 className="mt-3">{privacy.title}</h1>
          <p className="mt-3 text-small text-ink/75">
            Last updated {privacy.updated}
          </p>

          {privacy.sections.map((section) => (
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
