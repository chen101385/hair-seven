/**
 * Hair Seven — single source of truth for all editable business content.
 *
 * This is the ONLY file you need to edit to change what the site says.
 * Everything marked PLACEHOLDER or VERIFY still needs a real answer from Kim.
 *
 * Run `npm run punchlist` to print every outstanding item.
 */

export const site = {
  name: "Hair Seven",
  tagline:
    "PLACEHOLDER — one line, e.g. 'Cuts, color, and styling in Mountain View since 1994.'",

  phone: "(650) 555-0147", // PLACEHOLDER — real salon number
  phoneHref: "+16505550147", // PLACEHOLDER — same number, E.164 format, for the tel: link
  email: "PLACEHOLDER@example.com",

  address: {
    street: "PLACEHOLDER — street address",
    city: "Mountain View",
    state: "CA",
    zip: "PLACEHOLDER",
    mapsUrl: "PLACEHOLDER — Google Maps share link",
  },

  /**
   * The salon's timezone. Slot generation and the "is it too late to book today"
   * check are done in salon time, not the visitor's, so someone browsing from
   * out of state doesn't get offered a slot that has already passed here.
   */
  timeZone: "America/Los_Angeles",

  // Hours drive BOTH the Hours section and the booking time slots. One source of truth.
  // Use 24h "HH:MM" internally; render as 12h with AM/PM. null = closed.
  // Times confirmed: 10:00 AM to 6:00 PM. Closed days still need confirming with Kim.
  hours: [
    { day: "Sunday", open: null, close: null }, // VERIFY — closed?
    { day: "Monday", open: null, close: null }, // VERIFY — closed?
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
      description: "PLACEHOLDER — one sentence, plain language.",
      priceLow: 45,
      priceHigh: 75, // PLACEHOLDER
      note: "",
    },
    {
      name: "Color — single process",
      description: "PLACEHOLDER — one sentence, plain language.",
      priceLow: 95,
      priceHigh: 160, // PLACEHOLDER
      note: "PLACEHOLDER — e.g. 'Final price depends on hair length and thickness.'",
    },
    // PLACEHOLDER — add highlights, perm, blowout, styling, treatments, etc.
    // Set priceLow/priceHigh to the same number for a single price.
    // Set either to null to render "Call for pricing."
  ] as ReadonlyArray<{
    name: string;
    description: string;
    priceLow: number | null;
    priceHigh: number | null;
    note: string;
  }>,

  pricingNote:
    "Prices are ranges because length, thickness, and time in the chair vary. Kim will confirm the price with you before she starts.",

  about: {
    heading: "About Kim",
    photo: "/kim.jpg",
    photoAlt:
      "Kim, owner of Hair Seven, standing between the styling chairs in her Mountain View salon.",
    paragraphs: [
      "Kim has run Hair Seven since 1994 — the same chair, in the same neighborhood, for more than thirty years.",
      "PLACEHOLDER — what she specializes in and who her regulars are. Ask Kim: cuts, color, perms, anything she's known for.",
      "PLACEHOLDER — something human. What she's like to sit with for an hour.",
    ],
    // The one bit of the page that isn't about the salon.
    note: {
      photo: "/kim-and-chris.jpg",
      photoAlt: "Kim and Chris together in the salon.",
      text: "This website was built by Chris, one of Kim's most loyal customers — he's been going to her since 1997.",
    },
  },

  notify: {
    smsTo: "+1PLACEHOLDER", // Kim's mobile — recorded for reference only, nothing is ever texted from this site
    emailTo: "PLACEHOLDER@example.com",
  },
} as const;

export type Site = typeof site;
export type DayHours = (typeof site.hours)[number];
export type Service = (typeof site.services)[number];
