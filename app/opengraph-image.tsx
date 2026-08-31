import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { isPlaceholder } from "@/lib/placeholder";

/**
 * The card that shows when someone texts this link to a friend — which is how
 * most of Kim's clientele will actually share it. Without this it renders as a
 * bare URL with no picture.
 *
 * Generated rather than a static file so it follows content/site.ts: change the
 * salon name, phone or address and the card follows.
 */
export const alt = `${site.name} — hair salon in ${site.address.city}, ${site.address.state}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#22303A";
const AWNING = "#2E5E4E";
const AWNING_DARK = "#234A3E";
const BRASS = "#B07D2B";
const PAPER = "#FBF9F5";

export default function OpengraphImage() {
  const tagline = isPlaceholder(site.tagline) ? "" : site.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
        }}
      >
        {/* The awning valance, same motif as the site header. */}
        <div style={{ display: "flex", height: 28 }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: i % 2 === 0 ? AWNING_DARK : PAPER,
              }}
            />
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 84px",
          }}
        >
          <div
            style={{
              fontSize: 104,
              fontWeight: 700,
              color: INK,
              letterSpacing: -1,
            }}
          >
            {site.name}
          </div>

          {tagline ? (
            <div
              style={{
                marginTop: 20,
                fontSize: 38,
                color: INK,
                opacity: 0.8,
                maxWidth: 900,
              }}
            >
              {tagline}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 34,
              width: 132,
              height: 6,
              background: BRASS,
              display: "flex",
            }}
          />

          <div
            style={{
              marginTop: 34,
              fontSize: 34,
              color: INK,
              opacity: 0.85,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Satori requires an explicit display on any element with more
                than one child, and each interpolation counts as a child — so
                these are built as single strings. */}
            <div>
              {`${site.address.street} · ${site.address.city}, ${site.address.state}`}
            </div>
            <div style={{ marginTop: 8, fontWeight: 700, color: AWNING }}>
              {site.phone}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
