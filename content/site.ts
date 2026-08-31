/**
 * Hair 7 — single source of truth for all editable business content.
 *
 * This is the ONLY file you need to edit to change what the site says.
 * Everything marked PLACEHOLDER or VERIFY still needs a real answer from Kim.
 *
 * Run `npm run punchlist` to print every outstanding item.
 */

export const site = {
  name: "Hair 7",
  tagline: "Cuts, color, and styling in Mountain View since 1994.",

  phone: "(650) 949-0796",
  phoneHref: "+16509490796",
  email: "PLACEHOLDER@example.com",

  address: {
    street: "1040 Grant Rd, Ste 150",
    /** The landmark line — how regulars actually describe where it is. */
    place: "Inside Beauty Plaza",
    city: "Mountain View",
    state: "CA",
    zip: "94040",
    // A Google Maps search link built from the address above. Works as-is;
    // swap in the salon's own Google Business "share" link once it's claimed.
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=1040+Grant+Rd+Ste+150+Mountain+View+CA+94040",
  },

  /**
   * The salon's timezone. Slot generation and the "is it too late to book today"
   * check are done in salon time, not the visitor's, so someone browsing from
   * out of state doesn't get offered a slot that has already passed here.
   */
  timeZone: "America/Los_Angeles",

  // Hours drive BOTH the Hours section and the booking time slots. One source of
  // truth. Use 24h "HH:MM" internally; render as 12h with AM/PM. null = closed.
  // Open seven days: 10-6 Monday through Saturday, 10-5 on Sunday.
  hours: [
    { day: "Sunday", open: "10:00", close: "17:00" },
    { day: "Monday", open: "10:00", close: "18:00" },
    { day: "Tuesday", open: "10:00", close: "18:00" },
    { day: "Wednesday", open: "10:00", close: "18:00" },
    { day: "Thursday", open: "10:00", close: "18:00" },
    { day: "Friday", open: "10:00", close: "18:00" },
    { day: "Saturday", open: "10:00", close: "18:00" },
  ],

  booking: {
    slotMinutes: 30, // interval between offered times
    lastSlotBufferMin: 60, // stop offering slots this long before close
    leadTimeHours: 12, // no requests for slots sooner than this
    daysAhead: 21, // how far out the day picker runs
    blackoutDates: [] as string[], // "2026-11-26" etc — vacations, holidays
    replyWindow: "24 to 48 hours",
  },

  hoursNote:
    "PLACEHOLDER — e.g. 'By appointment. Walk-ins welcome when the chair is open.'",

  services: [
    {
      name: "Haircut",
      description: "Men, women, and children.",
      priceLow: null, // PLACEHOLDER — get real prices from Kim
      priceHigh: null, // PLACEHOLDER
      note: "",
      items: [],
    },
    {
      name: "Hair styling",
      description: "Men, women, and children.",
      priceLow: null, // PLACEHOLDER
      priceHigh: null, // PLACEHOLDER
      note: "",
      items: [],
    },
    {
      name: "Hair coloring",
      description: "PLACEHOLDER — ask Kim what she offers: single process, highlights, grey coverage?",
      priceLow: null, // PLACEHOLDER
      priceHigh: null, // PLACEHOLDER
      note: "",
      items: [],
    },
    {
      name: "Waxing",
      description: "",
      priceLow: null, // PLACEHOLDER — likely priced per area
      priceHigh: null, // PLACEHOLDER
      note: "",
      items: [
        "Arms",
        "Back",
        "Bikini area",
        "Chest",
        "Chin",
        "Eyebrows",
        "Face",
        "Legs",
        "Lips",
        "Underarms",
      ],
    },
  ] as ReadonlyArray<{
    name: string;
    description: string;
    priceLow: number | null;
    priceHigh: number | null;
    note: string;
    /** Sub-items listed under the service, e.g. waxing areas. */
    items: readonly string[];
  }>,

  pricingNote:
    "Price depends on length, thickness, and time in the chair. Give Kim a call and she'll quote you — and she'll always confirm the price with you before she starts.",

  about: {
    heading: "About Kim",
    photo: "/kim.jpg",
    photoAlt:
      "Kim, owner of Hair 7, standing between the styling chairs in her Mountain View salon.",
    paragraphs: [
      "Kim has run Hair 7 since 1994 — the same chair, in the same neighborhood, for more than thirty years.",
      "She does haircuts and hair styling for men, women, and children, along with hair coloring and waxing.",
      "She is an incredibly kind and humble person, and over the years she has given more than a few of her regulars some genuinely good advice and wisdom along with the haircut.",
    ],
    // The one bit of the page that isn't about the salon.
    note: {
      photo: "/kim-and-chris.jpg",
      photoAlt: "Kim and Chris together in the salon.",
      text: "This website was built by Chris, one of Kim's most loyal customers — he's been going to her since 1997.",
    },
  },

  // Where form submissions are sent is NOT set here — it lives in .env.local
  // (NOTIFY_BOOKING_EMAIL and NOTIFY_QUESTIONS_EMAIL), so the two routes can
  // point at different inboxes without a code change. See the README.
} as const;

export type Site = typeof site;
export type DayHours = (typeof site.hours)[number];
export type Service = (typeof site.services)[number];
