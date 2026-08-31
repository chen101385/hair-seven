# Hair 7

Marketing site for Hair 7, a single-owner hair salon in Mountain View, CA.
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

With the current settings, a 10:00–18:00 day yields 15 slots (10:00 AM through
5:00 PM) and Sunday's 10:00–17:00 yields 13 (through 4:00 PM).

**How the booking actually works.** Kim keeps her appointment book on paper, so
the site never claims to hold a slot. A visitor picks **one day** and then taps
**every time on it that would work for them** — several is the normal case. The
email lists all of them, Kim checks her book, and she replies confirming
whichever one she has. That is why there is no "backup time" field: picking four
times on Thursday does the same job with one less thing to understand.

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
- Times are multi-select, with a running "You picked 3 times: …" summary and a Clear button, so nobody has to remember what they tapped.
- Errors are inline and in plain words: "Please enter a mobile number so Kim can text you back," never "Invalid input."
- Nothing a visitor typed is ever cleared by an error, including the picker selection.
- Spam control is a honeypot field plus a minimum time-on-page check. No CAPTCHA — a CAPTCHA locks out exactly the people this site exists for.

Verified: zero `axe-core` violations (WCAG 2.1 A/AA plus best-practice) across
the default, times-picked, error, flexible, question-tab, and confirmation
states; visible focus ring at every keyboard stop; no horizontal scroll at 200%
zoom.

Checked at 320, 375, 390, 768, 834, 1024 and 1440px — phone, iPad portrait and
landscape, and desktop. At every one of them: no horizontal scroll, no tap
target under 48px, no text under 16px, and anchor links that land clear of the
sticky header. The fixed call bar shows below 768px and hides above it, where
the header nav is already on one row.

### Deliberately out of scope

Online payment, real-time calendar booking, accounts, a blog, a photo gallery,
reviews, analytics, cookie banners. If real-time booking comes up later, the
answer is to link out to Square Appointments or Booksy rather than build it.

---

## Picking this up on another machine

```bash
git clone git@github.com:chen101385/hair-seven.git
cd hair-seven
npm install
npm run dev
```

Needs Node 20.9+. Nothing else — no accounts, no API keys. The forms work in
stub mode out of the box.

Two things are **deliberately not in the repo**, so a fresh clone won't have
them:

- `.env.local` — copy `.env.local.example` to `.env.local` if you want to set
  the notify addresses. Not needed for stub mode.
- `.submissions.log` — created on the first form submission.

If `npm install` fails with `EACCES ... /.npm/_cacache`, the npm cache has
root-owned files from an old npm bug. Either fix it once with
`sudo chown -R $(id -u):$(id -g) ~/.npm`, or work around it per-command:

```bash
npm_config_cache=/tmp/npm-cache npm install
```

---

## What's left

**Status:** the site is content-complete except for prices, and runs locally.
Nothing is deployed and no domain is assigned yet.

### 1. Still needs an answer from Kim

`npm run punchlist` prints the authoritative list with line numbers — it greps
the content file, so it can't go stale. This table is the human summary of the
same thing:

| Item | Where |
| --- | --- |
| **Prices.** Every service currently reads "Call for pricing." | `content/site.ts` → `services[].priceLow` / `priceHigh` |
| What kinds of coloring she does — single process, highlights, grey coverage? | `services[]` → Hair coloring `description` |
| The hours note — walk-ins welcome, or appointment only? | `hoursNote` |
| A lunch break, if she takes one at a fixed time | `hours` — would need a second range per day, which the picker doesn't model yet |
| The public contact email shown in the footer | `email` |
| Which inbox should receive booking requests | `.env.local` → `NOTIFY_BOOKING_EMAIL` |
| **Is she happy with both photos being public?** | `public/kim.jpg`, `public/kim-and-chris.jpg` |
| A real logo or mark, if she has one | `app/favicon.ico`, `app/icon.svg` — both placeholders |

> The photos are in this repo. It's private today, but if it ever goes public or
> gains collaborators, they go with it. Worth asking her before that happens.

### 2. Open decisions on the build

None of these are bugs — they're judgment calls left open on purpose.

- **"Call for pricing." appears on all four services.** Honest, and it'll thin
  out once real prices land, but as a block it reads flat. The alternative is to
  hide the per-service price while they're all unknown and let `pricingNote`
  carry it.
- **The Google Maps link is a search URL** built from the street address, not
  her Google Business listing. It works; swap it for the real place link if she
  claims the listing. `content/site.ts` → `address.mapsUrl`.
- **You can only offer times on one day.** Multi-select replaced the old backup
  day/time picker. Someone who's free "Tuesday or Thursday" has to use the
  "I'm flexible" box. Adding an "Add another day" button back is straightforward
  if it turns out to matter.

### 3. Launch checklist, in order

1. **Buy the domain in Kim's name, not yours.** Otherwise this becomes a
   permanent obligation you can't hand off.
2. **Start Resend DNS verification the same day you buy the domain.** It won't
   send from her domain until the records propagate — a day or two. This is the
   step that bites people the night before launch.
3. Create the two inbox aliases (`book@`, `hello@`) and set
   `NOTIFY_BOOKING_EMAIL` / `NOTIFY_QUESTIONS_EMAIL`.
4. Set `RESEND_API_KEY` and `RESEND_FROM`. Stub mode ends the moment the key is
   present — submit one of each form and confirm both arrive.
5. Set `NEXT_PUBLIC_SITE_URL` to the real origin. It drives the canonical URL,
   Open Graph tags, `robots.txt` and `sitemap.xml`, all of which point at
   `localhost:3000` until you do.
6. Deploy. Note `app/page.tsx` sets `revalidate = 900`, so the host needs to run
   it as a server, not a static export — the booking picker depends on the
   current date.
7. Claim the Google Business Profile and point it at the new domain. That plus
   the `LocalBusiness` JSON-LD is what eventually outranks the Yelp page.
8. **Test the phone link on a real handset.** The `tel:` href is correct but has
   only ever been checked in a browser.

### 4. Still worth asking

**Does Kim want her cell number published at all?** Some owners don't. If she
doesn't, the forms become the only inbound channel and the header number should
point at the shop line instead. Everything reads from `site.phone` /
`site.phoneHref`, so it's a one-line change either way.
