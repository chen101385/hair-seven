import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ClosedDays } from "@/components/ClosedDays";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { listClosedDays } from "@/lib/closed-days";
import { CLOSED_COOKIE, verifySessionToken } from "@/lib/closed-session";
import { listClosableDays } from "@/lib/hours";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Closed days — ${site.name}`,
  robots: { index: false, follow: false },
};

export default async function ClosedPage() {
  const token = (await cookies()).get(CLOSED_COOKIE)?.value;
  const signedIn = verifySessionToken(token);

  return (
    <>
      <Header />
      <main className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <ClosedDays
            signedIn={signedIn}
            days={listClosableDays()}
            closed={signedIn ? await listClosedDays() : []}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
