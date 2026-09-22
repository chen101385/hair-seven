import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { site } from "@/content/site";
import { terms } from "@/content/terms";

export const metadata: Metadata = {
  title: `${terms.title} — ${site.name}`,
  description: `Terms for requesting an appointment at ${site.name} and for the transactional SMS program.`,
  alternates: { canonical: terms.path },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalDocument
      title={terms.title}
      updated={terms.updated}
      sections={terms.sections}
    />
  );
}
