import { site } from "@/content/site";
import { formatDayHours } from "@/lib/hours";
import { isPlaceholder } from "@/lib/placeholder";
import { PinIcon } from "./icons";

export function HoursSection() {
  const { address } = site;
  const hasMapLink = !isPlaceholder(address.mapsUrl);

  return (
    <section id="hours" className="bg-tint">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2>Hours &amp; where to find us</h2>

        <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-start">
          {/* Same card treatment as the appointment card. */}
          <div className="card card-tilt-alt p-6">
            <h3 className="card-rule pb-2 font-display">Hours</h3>

            <table className="mt-4 w-full border-collapse">
              <caption className="sr-only">
                Opening hours for {site.name}, by day of the week
              </caption>
              <tbody>
                {site.hours.map((day) => {
                  const closed = !day.open || !day.close;
                  return (
                    <tr key={day.day} className="border-b border-ink/10 last:border-b-0">
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left font-semibold"
                      >
                        {day.day}
                      </th>
                      <td
                        className={`py-2 text-right whitespace-nowrap ${
                          closed ? "text-ink/75" : ""
                        }`}
                      >
                        {formatDayHours(day.open, day.close)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-4 text-small text-ink/75">{site.hoursNote}</p>
          </div>

          <div>
            <h3 className="flex items-center gap-2">
              <PinIcon className="h-5 w-5 shrink-0 text-brass" />
              Where to find us
            </h3>

            <address className="mt-3 not-italic">
              {address.street}
              <br />
              {address.city}, {address.state} {address.zip}
            </address>

            {hasMapLink ? (
              <a
                href={address.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary mt-4"
              >
                Open in Google Maps
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <p className="mt-4 text-small text-ink/75">
                Map link: {address.mapsUrl}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
