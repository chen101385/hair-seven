# Hair 7

Marketing site for Hair 7, a single-owner hair salon in Mountain View, CA.
It replaces a Yelp listing as the salon's primary web presence.

One scrolling page. Two forms — an appointment request and a general question —
that text Kim directly. There is no email notification. Kim then calls or texts
the visitor herself.

---

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:3000>.

No accounts, no API keys, and no spend are needed. With Twilio unset
the site runs in **stub mode**: both forms work end to end, every submission is
printed to the terminal as the SMS Kim would have received, and a copy is
appended to `.submissions.log`. Nothing is texted and nothing is emailed. That
log file is gitignored — it holds real visitor details once the site is live.

Other scripts:

```bash
npm run punchlist
```

Prints every outstanding `PLACEHOLDER` and `VERIFY` — the list to take to Kim.

```bash
npm run sms:preview
```

Prints the live templates (Kim's booking link and the customer texts), with
character count and how many texts each costs. A booking without notes stays
one 160-character SMS. Notes can use a second concatenated text, hard-capped at
306 GSM-7 characters.

```bash
npm run sms:campaign
```

Prints paste-ready A2P 10DLC sample messages and the campaign description.
Customer texts include STOP/HELP. Kim's Hair7 BOOK / Hair7 Q notices are
internal and should not be submitted as campaign samples.

```bash
npm test
```

Covers the scheduling maths in `lib/hours.ts` — timezone, lead time,
availability windows, closed days, blackout dates — plus phone validation and
the rate limiter. **Run this after changing the hours in `content/site.ts`**: it
is the thing that catches a day being offered that Kim is closed, or a time
being offered that has already passed.

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
| `leadTimeHours` | No requests sooner than this (12) |
| `daysAhead` | How far out the day picker runs (21) |
| `blackoutDates` | One-off closures: `["2026-11-26"]`. Vacations and holidays. Removes the day from the picker but leaves the weekly Hours table alone |
| `replyWindow` | The "24 to 48 hours" promise, used in three places |

With the current hours, a 10:00–18:00 day yields three windows: 10–12, 12–3,
and 3–6. Tuesday is one 2–6 PM window, and Monday is omitted because Kim is
closed.

**How the booking actually works.** Kim keeps her appointment book on paper, so
the site never claims to hold a slot. A visitor can check **multiple services**,
picks **one day**, and then taps **every broad time window that would work** —
one, several, or all. The SMS lists them, Kim checks her book, and she calls or
texts back with an exact time.

**Prices.** The site lists every service without publishing individual prices.
Kim discusses pricing directly with each customer.

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

Copy the template and fill in the three values from the Twilio console
(<https://console.twilio.com>):

```bash
cp .env.local.example .env.local
```

| Variable | Where it comes from |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | Console home, Account Info. Starts with `AC` |
| `TWILIO_AUTH_TOKEN` | Same panel. Click to reveal, then paste |
| `TWILIO_FROM_NUMBER` | Phone Numbers → Active numbers, in E.164 (`+1…`). This is Twilio's sending number, not Kim's |
| `NOTIFY_MOBILE_NUMBER` | Already set to Kim's salon number, `+16509490796`. Change only if she wants texts elsewhere |
| `UPSTASH_REDIS_REST_URL` | Optional local alias. Production uses Marketplace `KV_REST_API_URL` |
| `UPSTASH_REDIS_REST_TOKEN` | Optional local alias. Production uses Marketplace `KV_REST_API_TOKEN` |
| `KV_REST_API_URL` | Injected by Vercel Marketplace Upstash Redis. Stores pending booking requests |
| `KV_REST_API_TOKEN` | Injected with the same Upstash store |
| `NEXT_PUBLIC_SITE_URL` | Production is `https://hair7salon.com` (set on Vercel). Local preview stays `http://localhost:3001` |

Until **all three** Twilio values are set the site stays in stub mode: the SMS
is printed to the dev-server console (with the names of the variables still
unset) and appended to `.submissions.log`, and the visitor still gets a normal
confirmation. A missing credential never fails someone's request. There are no
email variables and none should be added — Kim does not receive form
submissions by email.

A US Twilio number usually needs A2P 10DLC registration before it will deliver
reliably to mobile phones. Start that in the Twilio console when you buy the
number — it can take a few days. Campaign reviewers expect a public privacy
policy that talks about SMS. This site’s is at `/privacy`
(https://hair7salon.com/privacy). Paste that URL into the brand/campaign form.
Run `npm run sms:campaign` for the use-case paragraph and sample message
bodies. Turn on Twilio Advanced Opt-Out so STOP, START, and HELP work without
an extra webhook. The backend is already `POST /api/contact` (texts Kim) and
`POST /api/kim/requests/[token]` (texts the customer). Both call Twilio when
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` are set on
Vercel; until then they still accept submissions and print the SMS.

Restart `npm run dev` after saving `.env.local`. On Vercel, add the same keys
under Project Settings → Environment Variables.

Blank Upstash / KV values use an in-memory store for local review. The
hair-seven Vercel project is already linked to the Marketplace store
`upstash-kv-sky-globe` (Free plan, San Francisco primary). Preview and
production deployments receive `KV_REST_API_URL` and `KV_REST_API_TOKEN`
automatically. **Those environments must keep that store connected**; serverless
memory does not persist reliably between the booking submission and Kim opening
her link.

An appointment SMS starts with `Hair7 BOOK` and includes a private, random link.
Kim opens it on her phone or tablet, taps Yes and an exact time, or taps No and
up to three alternative windows. The app sends the customer a fixed English
message. Links expire after seven days and can only be completed once.

---

## How it's put together

```
content/site.ts          All editable business content. The only file Chris edits.
lib/hours.ts             Hours formatting + slot generation. Reads site.hours.
lib/booking-requests.ts  Seven-day pending requests (Upstash; memory locally).
lib/validate.ts          Validation shared by the browser and the API route.
lib/notify.ts            SMS composition, Twilio delivery, stub mode.
lib/placeholder.ts       Keeps placeholders out of links and structured data.
app/page.tsx             The single page.
app/api/contact/route.ts Receives the forms; texts Kim via Twilio (or stub).
app/api/kim/requests/    Kim's Yes/No; texts the customer via the same helper.
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
the default, times-picked, error, question-tab, and confirmation states; visible
focus ring at every keyboard stop; no horizontal scroll at 200% zoom.

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
  up Twilio and Kim's notification number. Not needed for stub mode.
- `.submissions.log` — created on the first form submission.

If `npm install` fails with `EACCES ... /.npm/_cacache`, the npm cache has
root-owned files from an old npm bug. Either fix it once with
`sudo chown -R $(id -u):$(id -g) ~/.npm`, or work around it per-command:

```bash
npm_config_cache=/tmp/npm-cache npm install
```

---

## What's left

**Status:** the site runs locally and keeps pricing as a direct conversation.
Nothing is deployed and no domain is assigned yet.

### 1. Still needs an answer from Kim

`npm run punchlist` prints the authoritative list with line numbers — it greps
the content file, so it can't go stale. This table is the human summary of the
same thing:

| Item | Where |
| --- | --- |
| The hours note — walk-ins welcome, or appointment only? | `hoursNote` |
| A lunch break, if she takes one at a fixed time | `hours` — would need a second range per day, which the picker doesn't model yet |
| **Is she happy with both photos being public?** | `public/kim.jpg`, `public/kim-and-chris.jpg` |
| A real logo or mark, if she has one | `app/favicon.ico`, `app/icon.svg` — both placeholders |

> The photos are in this repo. It's private today, but if it ever goes public or
> gains collaborators, they go with it. Worth asking her before that happens.

[`LAUNCH.md`](LAUNCH.md) Phase 0 has the rest of the list — including two that
only surfaced from searching for her existing listings: **is the business
"Hair 7" or "Kim's Hair 7"**, and **which hours are the real ones**, because
Yelp and this site disagree.

### 2. Open decisions on the build

None of these are bugs — they're judgment calls left open on purpose.

- **The Google Maps link is a search URL** built from the street address, not
  her Google Business listing. It works; swap it for the real place link if she
  claims the listing. `content/site.ts` → `address.mapsUrl`.

### 3. Launch checklist

Moved to **[`LAUNCH.md`](LAUNCH.md)** — the full path from here to "Kim's
customers can find this by searching," including the domain and SMS setup,
deploy, Google Business Profile, cleaning up her existing directory listings,
and SEO. Short version of the order:

1. Settle the open questions with Kim (§1 above, plus `LAUNCH.md` Phase 0)
2. Domain and SMS notifications — **both registered in her name**
3. Deploy and verify
4. Google Business Profile — the highest-value hour in the whole project
5. Fix the conflicting third-party listings
6. Search Console, then wait

> `LAUNCH.md` also documents what a search currently turns up for Kim: six
> directory listings using three different spellings of her name and three
> different sets of hours. Sorting that out matters more than anything in this
> repo.

### 4. Still worth asking

**Does Kim want her cell number published at all?** Some owners don't. If she
doesn't, the forms become the only inbound channel and the header number should
point at the shop line instead. Everything reads from `site.phone` /
`site.phoneHref`, so it's a one-line change either way.
