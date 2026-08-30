import { About } from "@/components/About";
import { BookSection } from "@/components/BookSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HoursSection } from "@/components/HoursSection";
import { MobileBar } from "@/components/MobileBar";
import { Reveal } from "@/components/Reveal";
import { Services } from "@/components/Services";
import { StructuredData } from "@/components/StructuredData";
import { getAvailableDays } from "@/lib/hours";

/**
 * The picker's days depend on "now", so the page is re-rendered on the server
 * every 15 minutes rather than baked at build time. With a 12-hour lead time,
 * 15 minutes of staleness can't offer anyone a slot they shouldn't get — and
 * the API route re-checks the slot on submit regardless.
 */
export const revalidate = 900;

export default function Home() {
  const days = getAvailableDays();

  return (
    <>
      <StructuredData />
      <Header />

      <main>
        {/* The hero is above the fold — nothing to fade in. */}
        <Hero />

        <Reveal>
          <Services />
        </Reveal>
        <Reveal>
          <About />
        </Reveal>
        <Reveal>
          <HoursSection />
        </Reveal>
        <Reveal>
          <BookSection days={days} />
        </Reveal>
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
