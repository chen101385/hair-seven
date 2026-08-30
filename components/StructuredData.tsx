import { site } from "@/content/site";
import { openingHoursSpecification } from "@/lib/hours";
import { realOrUndefined } from "@/lib/placeholder";

/**
 * LocalBusiness + HairSalon, driven off content/site.ts. This is what earns the
 * site a knowledge panel and, over time, a better result than the Yelp page.
 *
 * Anything still marked PLACEHOLDER is omitted rather than published — a search
 * engine should get nothing before it gets "PLACEHOLDER — street address".
 */
export function StructuredData() {
  const { address } = site;
  const prices = site.services.flatMap((service) =>
    service.priceLow != null && service.priceHigh != null
      ? [service.priceLow, service.priceHigh]
      : [],
  );

  const data = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HairSalon"],
    name: site.name,
    description: realOrUndefined(site.tagline),
    telephone: site.phoneHref,
    email: realOrUndefined(site.email),
    url: process.env.NEXT_PUBLIC_SITE_URL,
    hasMap: realOrUndefined(address.mapsUrl),
    address: {
      "@type": "PostalAddress",
      streetAddress: realOrUndefined(address.street),
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: realOrUndefined(address.zip),
      addressCountry: "US",
    },
    openingHoursSpecification: openingHoursSpecification(),
    priceRange: prices.length
      ? `$${Math.min(...prices)}–$${Math.max(...prices)}`
      : undefined,
    makesOffer: site.services.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.name },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify drops the undefined keys above. Escaping "<" keeps a
      // stray closing tag in the content file from breaking out of the script.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
