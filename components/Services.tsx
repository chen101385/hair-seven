import { site } from "@/content/site";
import { formatPrice } from "@/lib/hours";

export function Services() {
  return (
    <section id="services" className="bg-tint">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2>Services</h2>

        <ul className="mt-8 border-y border-ink/15">
          {site.services.map((service) => (
            <li
              key={service.name}
              className="flex flex-col gap-1 border-b border-ink/15 py-5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
            >
              <div className="sm:flex-1">
                <h3>{service.name}</h3>
                {service.description ? (
                  <p className="mt-1">{service.description}</p>
                ) : null}
                {service.items.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:max-w-md">
                    {service.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {service.note ? (
                  <p className="mt-1 text-small text-ink/75">{service.note}</p>
                ) : null}
              </div>
              <p className="font-display text-[1.375rem] font-semibold text-brass-ink sm:shrink-0 sm:text-right">
                {formatPrice(service.priceLow, service.priceHigh)}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-3xl">{site.pricingNote}</p>
      </div>
    </section>
  );
}
