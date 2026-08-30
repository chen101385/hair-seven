import type { Metadata, Viewport } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const description = `${site.name} is a hair salon in ${site.address.city}, ${site.address.state}. ${site.tagline} Call ${site.phone} or request an appointment online.`;

export const metadata: Metadata = {
  // PLACEHOLDER — set NEXT_PUBLIC_SITE_URL once the domain is assigned.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: `${site.name} — Hair Salon in ${site.address.city}, ${site.address.state}`,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: `${site.name} — Hair Salon in ${site.address.city}, ${site.address.state}`,
    description,
    siteName: site.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Hair Salon in ${site.address.city}, ${site.address.state}`,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do not lock zoom. Half this audience will pinch to read.
  maximumScale: 5,
  themeColor: "#2E5E4E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${sourceSans.variable} antialiased`}
    >
      <head>
        {/* If JavaScript never arrives, every section still renders. */}
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
