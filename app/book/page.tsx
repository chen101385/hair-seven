import type { Metadata } from "next";
import { BookSection } from "@/components/BookSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBar } from "@/components/MobileBar";
import { site } from "@/content/site";
import { getAvailableDays } from "@/lib/hours";

/**
 * The booking form on its own URL. The homepage anchor works for visitors,
 * but carriers and A2P reviewers need a fragment-free link that lands
 * directly on the SMS opt-in.
 */
export const revalidate = 900;

export const metadata: Metadata = {
  title: `Request an Appointment — ${site.name}`,
  description: `Request an appointment or ask Kim a question at ${site.name} in ${site.address.city}, ${site.address.state}. Choose a call or a text; SMS consent is optional and never pre-checked.`,
  alternates: { canonical: "/book" },
  robots: { index: true, follow: true },
};

export default function BookPage() {
  return (
    <>
      <Header />
      <main>
        <BookSection days={getAvailableDays()} />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
