# Launch checklist

Everything between here and "Kim's customers can find this by searching."

Work top to bottom — the phases are ordered by dependency, not importance.
`README.md` has the day-to-day dev instructions; this file is the one-time
path to live.

---

## Read this first

**The website is not what will make Kim show up in search results.** For a
one-chair salon, the ranking order of effort is roughly:

1. **Google Business Profile** — claimed, complete, accurate, active
2. **Reviews** — recent ones, and Kim replying to them
3. **Consistent name / address / phone across every listing that mentions her**
4. **The website** — which mostly serves to confirm 1–3 and give people
   somewhere to book

The site is built and its technical SEO is already in decent shape. Most of
the work below is items 1–3, and almost none of it is code.

### What a search already turns up

Kim has a substantial online footprint that predates this site, and **it does
not agree with itself.** This is the single most valuable thing to fix.

| Source | Name it uses | Hours it lists |
| --- | --- | --- |
| This site | Hair 7 | Mon–Sat 10–6, Sun 10–5 |
| [Yelp](https://www.yelp.com/biz/kims-hair-7-mountain-view) (4.4★, 54 reviews) | Kim's Hair 7 | Mon–Fri 10–7 |
| [Fresha](https://www.fresha.com/lvp/hair-7-grant-road-mountain-view-vvWPYY) | Hair 7 | Mon–Fri 10–4, Sat 9–4, Sun 10–4 |
| [Yahoo Local](https://local.yahoo.com/info-21316589-kim-s-hair-7-mountain-view/) | Kim's Hair 7 | — |
| [YellowPages](https://www.yellowpages.com/mountain-view-ca/mip/kims-hair-seven-beauty-salon-544244160) | Kim's Hair Seven | — |
| [Nextdoor](https://nextdoor.com/pages/kims-hair-7/) | Kim's Hair 7 | — |

Three different sets of hours and three different spellings of the name.
Google cross-references these listings to decide how confident it is about a
business, and conflicting data suppresses ranking. It also sends real people
to a closed door.

Two more things that search turned up and Kim should weigh in on:

- **The Fresha page is not hers.** Its own footer says the business is "not
  currently affiliated with or partnered with Fresha" — it's a scraped
  directory entry with invented hours and a generic service list (balayage,
  extensions, keratin, wig install). She can claim or remove it.
- **The listings mention services this site doesn't:** perms, threading,
  highlights/lowlights/touch-up as distinct from "coloring," and facials.
  Some of that is probably scraped filler. Some may be real.

> Treat everything in that table as **a list of things to verify, not facts.**
> Aggregator sites scrape each other and go stale for years. The phone number
> `(650) 949-0796` and the address are consistent everywhere, which is a good
> sign; nothing else is.

---

## Phase 0 — The conversation with Kim

This is your next step anyway. These are the things that block launch, on top
of the content questions already in `README.md` § "Still needs an answer."

### Decisions only she can make

- [ ] **Which name is the real one — "Hair 7" or "Kim's Hair 7"?** Pick one
      and use that exact string everywhere, forever. This site says "Hair 7";
      Yelp and most directories say "Kim's Hair 7." Changing the site is one
      line in `content/site.ts`. Changing 6 directories is an afternoon.
      Whichever she picks, *the other becomes wrong* and gets corrected.
- [ ] **Confirm the real hours.** You gave me Mon–Sat 10–6, Sun 10–5. Yelp
      says Mon–Fri 10–7. They can't both be right, and the booking picker
      generates times directly from whatever is in `content/site.ts`.
- [ ] **Does she take a lunch break at a fixed time?** The picker can't model
      a mid-day gap yet. If she does, that's a small build change, and better
      to know now than after someone books into it.
- [ ] **Walk-ins, appointments, or both?** Every listing says walk-ins
      welcome. If that's still true, the site should say so prominently — it's
      a differentiator and it sets expectations for the booking form.
- [ ] **Perms, threading, facials — does she still do these?** They're on her
      listings and not on the site.
- [ ] **Is she happy with both photos being public?**
- [ ] **Does she want her number published?** (See README § "Still worth asking.")

### Things she has to own, not you

- [ ] **The domain goes in her name.** Her registrar account, her card, her
      email as the contact. You can administer it. If it's in your name, this
      becomes a permanent obligation you can't hand off, and she can't recover
      it if you're unreachable.
- [ ] **The Google Business Profile goes in her Google account.** Same reason,
      and it's harder to undo than the domain — profile ownership transfers are
      slow and sometimes fail. Add yourself as a Manager.
- [ ] **The Twilio account and number go in her name.** You can administer the
      setup, but she should be able to recover billing and credentials herself.

> Set this expectation early and plainly: you're building and running it, but
> everything of value is registered to her. It costs nothing now and saves a
> genuinely painful conversation later.

### What to bring back

The answers above, plus: does she have a logo file anywhere? A business card, a
sign photo, an old flyer? The favicon and app icon are placeholders.

---

## Phase 1 — Domain and SMS notifications

- [ ] **Buy the domain in Kim's name.** Something short and obvious —
      `hair7mv.com`, `kimshair7.com`. Match the name she picked in Phase 0.
      Avoid hyphens and avoid anything that has to be spelled out loud.
- [ ] **Set up Twilio in Kim's name.** Buy an SMS-capable number and complete
      the registration Twilio requires for application-to-person messaging.
- [ ] Add Kim's mobile as the notification destination and send a test SMS.

---

## Phase 2 — Deploy

- [ ] **Pick a host that runs it as a server.** `app/page.tsx` sets
      `revalidate = 900`, and the booking picker depends on the current date —
      a static export would freeze the available days. Vercel is the path of
      least resistance for Next.js and the free tier covers this traffic.
- [ ] Set the environment variables (`README.md` § "Turning on real
      notifications" has the table):
      - `NEXT_PUBLIC_SITE_URL` — the real origin, e.g. `https://hair7salon.com`
      - `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
      - `TWILIO_FROM_NUMBER`
      - `NOTIFY_MOBILE_NUMBER` — Kim's phone

> **`NEXT_PUBLIC_SITE_URL` is load-bearing for SEO,** not just cosmetic. It
> drives the canonical URL, the Open Graph tags, `robots.txt`, `sitemap.xml`,
> *and* the `url` field in the LocalBusiness structured data. Left unset, the
> structured data ships with no URL at all — which is the one field that ties
> the markup to the business entity Google already knows about.

- [ ] Point the domain at the host. Confirm HTTPS is on and `http://` and the
      `www.` variant both redirect to one canonical origin. Pick one and stick
      to it.
- [ ] Deploy.

---

## Phase 3 — Verify it's actually right before anyone sees it

Don't skip this. Everything downstream assumes the site is correct.

- [ ] `https://yourdomain.com/robots.txt` loads and its `Sitemap:` line points
      at the real domain, not `localhost:3000`.
- [ ] `https://yourdomain.com/sitemap.xml` loads and lists the real domain.
- [ ] `https://yourdomain.com/opengraph-image` renders the preview card.
- [ ] **Text the link to yourself.** Confirm the preview card appears in
      Messages. This is how most of Kim's customers will actually share it.
- [ ] View source, find the `application/ld+json` block, paste it into
      [Google's Rich Results Test](https://search.google.com/test/rich-results).
      Zero errors. Confirm `url`, `telephone` and `address` are all populated.
- [ ] **Submit one of each form and confirm both arrive** on Kim's phone with
      the right booking/question heading. Test both call-back and text-back
      preferences.
- [ ] **Test the phone link on a real handset.** The `tel:` href has only ever
      been checked in a browser.
- [ ] Open it on an actual iPhone and an actual iPad. Tap through the booking
      form start to finish.
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/) on the live URL.
      The site is small and should pass Core Web Vitals comfortably; if
      anything fails, it'll be an image.

---

## Phase 4 — Google Business Profile

**This is the highest-value hour of work in this entire document.** For local
salon searches, the profile outweighs the website by a wide margin.

- [ ] **Find out whether the profile is already claimed.** Search "Kim's Hair 7
      Mountain View" on Google. A place already exists. If you see "Own this
      business?" it's unclaimed and Kim can claim it. If it looks managed
      already, she may have claimed it years ago — check her email for old
      Google Business mail before starting a dispute.
- [ ] **Claim it in Kim's Google account.** Add yourself as a Manager
      afterwards.
- [ ] **Expect video verification.** A suite inside a shared building
      ("Ste 150, Inside Beauty Plaza") is exactly the case Google asks for a
      walkthrough video: street sign, building entrance, her suite, her
      station, and something showing she works there. Plan for it rather than
      being surprised by it.
- [ ] Fill in **every** field. Completeness is a ranking factor:
      - Primary category: **Hair Salon**. Secondary: **Beauty Salon**,
        **Waxing Hair Removal Service** if she does waxing.
      - The exact name from Phase 0 — no keyword stuffing. "Hair 7 — Best
        Mountain View Haircuts" is a suspension risk, not a strategy.
      - Address, phone, and **the new website URL**.
      - Hours — the real ones from Phase 0. Add holiday hours each year.
      - Services, with descriptions, and prices once you have them.
      - Attributes: walk-ins welcome, wheelchair accessible, languages spoken,
        appointments recommended, women-owned if she wants it.
      - The "from the business" description. Write it like a person: 30+ years
        at the same chair in Mountain View, what she's known for.
- [ ] **Photos matter more than you'd think** — they drive the engagement
      metrics Google reads as prominence. Get: the storefront, the plaza
      entrance so people can actually find the door, her station, and real
      haircuts (with the client's permission). A dozen good photos beats three.
- [ ] Turn on messaging only if she'll actually answer it. An ignored message
      channel is worse than none.
- [ ] Post something every few weeks. It doesn't have to be clever — holiday
      hours, a photo, a note that walk-ins are welcome on slow afternoons.

---

## Phase 5 — Clean up the other listings

This is the NAP-consistency work: **N**ame, **A**ddress, **P**hone, identical
everywhere, character for character. Do this after Phase 0 settles the name.

- [ ] **Yelp** — she has 54 reviews at 4.4★ here. That's a real asset; don't
      neglect it. Claim the page if it isn't claimed, fix the hours, add
      photos, respond to recent reviews, add the website link.
- [ ] **Apple Business Connect** (free) — this is Apple Maps and Siri. A lot of
      iPhone users never touch Google. Frequently missed and genuinely
      worth doing.
- [ ] **Bing Places** (free) — small direct traffic, but it feeds Copilot and
      some AI answers.
- [ ] **Fresha** — claim it and fix the invented hours, or ask them to remove
      it. Wrong hours on a page that ranks is worse than no page.
- [ ] **Nextdoor** — genuinely valuable for a neighborhood salon. Claim the
      page.
- [ ] **Yahoo Local / YellowPages** — fix the name spelling if it's easy;
      don't spend more than ten minutes. These are low-value but they're part
      of the consistency signal.
- [ ] **Facebook and Instagram**, if she wants them. A dormant profile is fine;
      an inconsistent one is not.
- [ ] Once these exist, **add them to the structured data** — see Phase 6.

> **Do not pay a "citation building" or "listing sync" service.** For one
> location it's an hour of manual work and the services mostly create spam
> listings you'll have to clean up later.

---

## Phase 6 — Tell search engines the site exists

- [ ] **Google Search Console** — add the domain, verify by DNS (you're already
      in the registrar from Phase 1), submit `sitemap.xml`. Request indexing
      for the homepage.
- [ ] **Bing Webmaster Tools** — same. It can import directly from Search
      Console. Turn on **IndexNow** while you're there; it pushes updates to
      Bing and Copilot rather than waiting to be crawled.
- [ ] Wait. Indexing takes days to a couple of weeks for a brand-new domain.
      Don't panic and don't resubmit repeatedly.
- [ ] Once indexed, search `site:yourdomain.com` to confirm it's in there, then
      search "hair salon mountain view" and see where she actually lands. Write
      the answer down so you can tell whether anything you do later helps.

---

## Phase 7 — On-page SEO

### Already done in the code

Nothing to do here — listed so you don't redo it or pay someone to:

- Semantic HTML, one `<h1>`, real heading hierarchy
- `LocalBusiness` + `HairSalon` JSON-LD with address, phone, and per-day
  `openingHoursSpecification` generated from `content/site.ts`
  (`components/StructuredData.tsx`)
- Canonical URL, Open Graph and Twitter card metadata (`app/layout.tsx`)
- A generated Open Graph preview image (`app/opengraph-image.tsx`)
- `robots.txt` and `sitemap.xml` generated from `NEXT_PUBLIC_SITE_URL`
- Mobile-first, fast, accessible — all three are ranking inputs, and the
  accessibility work done for Kim's older customers helps here for free
- Placeholder content is *omitted* from structured data rather than published,
  so nothing ships as "PLACEHOLDER — street address"

### Worth adding

- [ ] **`sameAs` links in the structured data.** Once Phase 5 is done, add the
      GBP, Yelp, Nextdoor, Facebook and Instagram URLs to
      `components/StructuredData.tsx`. This is how you tell Google that the
      website, the Yelp page with 54 reviews, and the map pin are all the same
      business. It is the highest-value code change in this list.
- [ ] **`image`** in the structured data — a photo of the salon, absolute URL.
      Feeds the knowledge panel.
- [ ] **`geo`** with latitude/longitude, taken from the GBP pin once it's
      verified.
- [ ] **`priceRange`** switches itself on automatically once real prices land
      in `content/site.ts`. Nothing to code.
- [ ] **An FAQ section on the page, with `FAQPage` schema.** Google mostly
      stopped showing FAQ rich results, so this isn't about a fancy snippet —
      it's that a plain question-and-answer block is the single most
      extractable format for AI answers. Use the questions people actually ask:
      *Do you take walk-ins? Where do I park? Do you cut children's hair? Do
      you do grey coverage? How far ahead should I book?*
- [ ] Work "Mountain View" into the page copy naturally — the H1, the About
      section, the footer. It's already in the title and description. Don't
      overdo it; there is no threshold you're trying to cross.

### Do not

- [ ] **Do not add `aggregateRating` or `review` markup to the site's own
      structured data.** Self-serving review markup violates Google's
      guidelines and can earn a manual action. Reviews live on Google and Yelp,
      which is exactly where they should live.
- [ ] Don't add more pages just to have more pages. A single honest page that
      answers real questions beats a thin "Services in Mountain View" doorway
      page, and always will.

---

## Phase 8 — AI search

Increasingly people ask an assistant "where should I get a haircut in Mountain
View" instead of searching. The good news is that **almost nothing here is
separate work** — AI answers are built on the same signals.

- [ ] **Confirm nothing is blocked.** `app/robots.ts` currently allows every
      crawler (`userAgent: "*", allow: "/"`), which already covers GPTBot,
      OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot and the rest.
      **Leave it alone.** If a host or a plugin ever adds AI-crawler blocks by
      default, that quietly removes her from AI answers.
- [ ] Understand what `Google-Extended` does before anyone tells you to set it:
      it controls whether content is used to train and ground Gemini. It does
      **not** control AI Overviews — those run off normal Googlebot indexing.
      Blocking it costs you AI visibility and buys nothing.
- [ ] **Skip `llms.txt`.** As of now no major AI provider has committed to
      reading it in production. If you want it, it's five minutes — but it is
      not the reason anyone will or won't be cited.
- [ ] **What actually gets a small business cited:** being in the top handful
      of normal organic results, a complete and active Google Business Profile,
      a rating above roughly 4.3 with *recent* reviews, clean structured data,
      and third-party pages that corroborate the same facts. Every one of those
      is Phases 4, 5 and 7. There is no separate AI channel to optimize.
- [ ] Write for extraction: short paragraphs, direct answers, plain language,
      facts stated once and stated clearly. The site already reads this way
      because it was written for an older audience — that turns out to be the
      same thing AI models parse well.
- [ ] Once live, **actually ask.** Query ChatGPT, Claude, Perplexity and Google
      AI Mode for "hair salon in Mountain View" and see whether she appears and
      whether the details are right. Repeat quarterly. Wrong facts in an AI
      answer usually trace back to a wrong directory listing — which points you
      straight back at Phase 5.

---

## Phase 9 — Reviews

The lever with the highest ratio of impact to effort, and the one that needs
Kim, not you.

- [ ] **Recency beats volume.** Ten reviews from the last three months
      outperform fifty where the newest is two years old. She has 54 on Yelp;
      the question is how recent.
- [ ] Get her Google review short link from the GBP dashboard. Put it on
      something physical — a card at the register, a line on the receipt.
- [ ] **The ask has to be in person and from Kim.** "If you're happy with it,
      a Google review really helps me" at the end of an appointment converts
      dramatically better than any automated follow-up.
- [ ] **She should reply to every review**, good and bad. Owner responses are a
      ranking signal and a trust signal. Two sentences is plenty.
- [ ] Never buy reviews, never incentivize them, never review-gate (asking
      happy customers publicly and unhappy ones privately). All three are
      against Google and Yelp policy and Yelp is aggressive about enforcement.
- [ ] Aim to stay above 4.3★. She's at 4.4 on Yelp — that's already in the
      band where AI answers and local packs will cite a business.

---

## Phase 10 — After launch

Small and regular beats a big push and then silence.

**Monthly, 15 minutes**
- [ ] Check GBP for user-submitted "edits" to hours or address — Google lets
      strangers suggest changes and sometimes just applies them.
- [ ] Reply to new reviews.
- [ ] Submit a test form and confirm the SMS still reaches Kim.

**Quarterly, an hour**
- [ ] Post something to GBP. Refresh a photo.
- [ ] Re-run the AI queries from Phase 8 and check the facts.
- [ ] Check Search Console for crawl errors and what people searched to find
      her.
- [ ] `npm test` and `npm run build` still pass; apply dependency updates.

**Annually**
- [ ] Holiday hours on GBP — before the holidays, not after.
- [ ] Confirm the domain and Twilio number are set to auto-renew and the card on file
      hasn't expired. **This is the most common way a small business site
      silently dies.**
- [ ] Re-read this file and check nothing has drifted.

---

## Don't bother

Things that will be pitched to you, that aren't worth it here:

- **SEO agencies and monthly retainers.** For one location, Phases 4, 5 and 9
  are the whole game, and they're a few hours of work.
- **Paid citation / directory-sync services.** Manual is faster and cleaner.
- **Google Ads**, at least at first. Fix the organic presence and see where
  it lands. She's been in business since 1994 — the demand already exists.
- **A blog.** Nobody is looking for salon content marketing, and an abandoned
  blog is a worse signal than no blog.
- **Rebuilding as a multi-page site.** One good page is correct here.
- **Anything promising to "get you to #1" or offering AI-search guarantees.**

---

## Realistic timeline

| | |
| --- | --- |
| Talk to Kim, get answers | Phase 0 |
| Domain and Twilio setup | Registration and verification vary |
| Deploy and verify | An afternoon |
| GBP claim → verified | **1–14 days**, longer if video verification stalls |
| Directory cleanup | 2–3 hours, spread out |
| Indexed by Google | 3–14 days after submission |
| Ranking meaningfully | **1–3 months** |
| AI answers reflecting the site | 1–3 months, roughly tracking the above |

**The site can be live within about a week of the Kim conversation.** Being
*findable* is the slower half, and most of that is waiting rather than working.
