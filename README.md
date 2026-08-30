# Hair Seven

Marketing site for Hair Seven, a single-owner hair salon in Mountain View, CA.
It replaces a Yelp listing as the salon's primary web presence.

One scrolling page. Two forms — an appointment request and a general question —
that route to two different email addresses with different subject prefixes.

**There is no outbound SMS.** Nothing in this application sends a text message.
When a visitor picks "Text me," that is a preference recorded at the top of the
email; Kim reads it and texts them back herself from her own phone. No Twilio,
no carrier registration, no per-message cost, no compliance surface.

---

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:3000>.

No accounts, no API keys, and no spend are needed. With `RESEND_API_KEY` unset
the site runs in **stub mode**: both forms work end to end, and every submission
is printed to the terminal in full and appended to `.submissions.log`. That file
is gitignored — it holds real visitor details once the site is live.

Other scripts:

```bash
npm run punchlist
```

Prints every outstanding `PLACEHOLDER` and `VERIFY` — the list to take to Kim.

```bash
npm run typecheck
```

```bash
npm run build
```

---

## Editing the content

**`content/site.ts` is the only file you need to touch.** Hours, services,
prices, the bio, phone, address, and every piece of copy live there. Nothing is
duplicated anywhere else.

A few things worth knowing:

**Hours drive the booking slots.** The `hours` array is the single source of
truth for both the Hours section and the day/time picker. Change Tuesday's
closing time and both update. Set a day to `open: null, close: null` and it
disappears from the picker entirely — closed days are never shown greyed out.

The array must stay in **Sunday-first order**; slot generation indexes into it
directly.

**Booking behaviour** is in `site.booking`:

| Setting | What it does |
| --- | --- |
| `slotMinutes` | Interval between offered times (30) |
| `lastSlotBufferMin` | Stops offering slots this long before close (60), so there's room for the appointment |
| `leadTimeHours` | No requests sooner than this (12) |
| `daysAhead` | How far out the day picker runs (21) |
| `blackoutDates` | One-off closures: `["2026-11-26"]`. Vacations and holidays. Removes the day from the picker but leaves the weekly Hours table alone |
| `replyWindow` | The "24 to 48 hours" promise, used in three places |

With the current settings, a 10:00–18:00 day yields 15 slots: 10:00 AM through
5:00 PM.

**Prices.** `$45–$75` renders from `priceLow` / `priceHigh`. Set them to the
same number for a single price. Set either to `null` and it renders
"Call for pricing."

**Placeholders ship visible on purpose.** Nothing in this build guesses at a
real price, address, or claim. Anything that would be *used* rather than *read*
— the Google Maps link, structured data — is checked first and simply omitted
while it's still a placeholder, so a placeholder never becomes a broken link or
a bogus entry in Google's index.

---

## Swapping the photos

Both photos live in `public/`:

- `kim.jpg` — the portrait in the About section
- `kim-and-chris.jpg` — the small photo in the note at the bottom of About

To replace one, drop the new file in `public/` and point
`site.about.photo` (or `site.about.note.photo`) at it. **Update the matching
`photoAlt` too** — the alt text describes that specific picture.

Photos are served through `next/image`, so they're resized and re-encoded
automatically; a large export straight from a phone is fine.

One gotcha: photos from an iPhone are often HEIC with an EXIF orientation flag.
`sips` converts them but can leave a stale orientation tag behind, which makes
the image render sideways. If that happens, strip it:

```bash
node -e "const s=require('sharp');s('public/kim.jpg').jpeg({quality:82}).toBuffer().then(b=>require('fs').writeFileSync('public/kim.jpg',b))"
```

---

## Turning on real notifications

Copy the template and fill it in:

```bash
cp .env.local.example .env.local
```

| Variable | What it's for |
| --- | --- |
| `RESEND_API_KEY` | Leave blank for stub mode. Set it and email actually sends |
| `RESEND_FROM` | The From address, on a domain verified in Resend |
| `NOTIFY_BOOKING_EMAIL` | Where `[BOOKING]` emails go |
| `NOTIFY_QUESTIONS_EMAIL` | Where `[QUESTION]` emails go |
| `NEXT_PUBLIC_SITE_URL` | Public origin, once a domain is assigned. Drives canonical URLs, Open Graph, `robots.txt`, `sitemap.xml` |

The two notify addresses can be two aliases on the same domain (`book@`,
`hello@`) or two entirely different inboxes. They are never hardcoded.

**The subject prefix is the whole point.** `[BOOKING]` and `[QUESTION]` let Kim
— or a Gmail filter — sort bookings from questions at a glance without opening
anything.

> **Plan for DNS.** Resend requires domain verification before it will send from
> the salon's domain. That's a day or two of propagation. Start it when you buy
> the domain, not the night before launch.

---

## How it's put together

```
content/site.ts          All editable business content. The only file Chris edits.
lib/hours.ts             Hours formatting + slot generation. Reads site.hours.
lib/validate.ts          Validation shared by the browser and the API route.
lib/notify.ts            Email composition, Resend delivery, stub mode.
lib/placeholder.ts       Keeps placeholders out of links and structured data.
app/page.tsx             The single page.
app/api/contact/route.ts One endpoint, branching on formType.
components/              Sections and the booking form.
```

`lib/validate.ts` is imported by both the client and the server, so the rules
can't drift. The API route re-checks the requested slot against the same
generator the picker used, rather than trusting the browser — a page left open
overnight can't submit a slot that's since gone stale.

### Who this is built for

The clientele skews older, 50s through 80s, mostly on iPhones and iPads, and
about half would rather just call. That shapes the whole thing:

- Body text is 19px with a 1.65 line-height. Nothing is below 16px, footer included.
- Tap targets are at least 48×48px with 12px between them.
- The phone number is in the header at every screen size, as a `tel:` link.
- No hamburger menu. On mobile the nav wraps to two rows of full-width labeled buttons.
- The day/time picker is buttons, not a calendar widget. No `datetime-local`, no date library UI.
- Errors are inline and in plain words: "Please enter a mobile number so Kim can text you back," never "Invalid input."
- Nothing a visitor typed is ever cleared by an error, including the picker selection.
- Spam control is a honeypot field plus a minimum time-on-page check. No CAPTCHA — a CAPTCHA locks out exactly the people this site exists for.

Verified: zero `axe-core` violations (WCAG 2.1 A/AA plus best-practice) across
the default, error, flexible, question-tab, and confirmation states at both
mobile and desktop widths; no horizontal scroll down to 320px or at 200% zoom;
visible focus ring at every keyboard stop.

### Deliberately out of scope

Online payment, real-time calendar booking, accounts, a blog, a photo gallery,
reviews, analytics, cookie banners. If real-time booking comes up later, the
answer is to link out to Square Appointments or Booksy rather than build it.

---

## Before showing Kim

Run `npm run punchlist`. The things that still need a real answer from her:

- Her exact service list, with honest price ranges
- Her real hours, including any lunch break
- **Which days she's actually closed.** Sunday and Monday are placeholders. A wrong closed day is the one error that costs her an actual appointment
- The tagline, and the rest of her bio
- The street address, ZIP, and a Google Maps link
- The email address that should receive booking requests
- Whether she's happy with both photos being public

Two decisions worth making now rather than later:

1. **Whose name is the domain in?** It should be hers, or this becomes a
   permanent obligation you can't hand off.
2. **Does she want her cell number published at all?** Some owners don't. If she
   doesn't, the forms become the only inbound channel and the header number
   points to the shop line instead.
