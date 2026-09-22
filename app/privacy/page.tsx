import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
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
    <LegalDocument
      title={privacy.title}
      updated={privacy.updated}
      sections={privacy.sections}
    />
  );
}
