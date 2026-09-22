/**
 * Privacy policy copy. Keep this aligned with how the booking form and
 * Twilio texts actually work — A2P 10DLC reviewers read it as a checklist.
 */

export const privacy = {
  path: "/privacy",
  title: "Privacy Policy",
  updated: "September 22, 2026",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        "Hair 7 is a one-chair hair salon at 1040 Grant Rd, Ste 150, Mountain View, CA 94040. Kim owns and runs the salon. This policy covers this website and the text messages we send about appointments and questions.",
      ],
    },
    {
      heading: "What we collect",
      paragraphs: [
        "When you use the appointment or question form, we collect your name, mobile or other phone number, whether you prefer a call or a text, the services and times you asked about, and any notes or question you type. We also keep technical details the site needs to stop spam, such as how long you spent on the form.",
      ],
    },
    {
      heading: "How we use your phone number for SMS",
      paragraphs: [
        "We use your phone number to contact you about the request you just sent: to confirm, reschedule, or answer a question. Hair 7 sends transactional SMS for that purpose. Message frequency varies. For a typical booking you may receive one text acknowledging the request or confirming a time, and sometimes a follow-up with alternative times. We do not send marketing texts, promotions, or recurring campaigns.",
        "You opt in by choosing “Text me,” entering your mobile number, checking the SMS consent box (it is never pre-checked), and submitting the form. Consent is not a condition of buying a haircut or any other service. You can always call the salon instead.",
      ],
    },
    {
      heading: "Opting out",
      paragraphs: [
        "Reply STOP to any Hair 7 text to opt out of SMS. After that we will not text that number unless you submit a new request. Reply HELP for help. You can also call (650) 949-0796 and ask Kim to stop texting you. Message and data rates may apply.",
      ],
    },
    {
      heading: "We do not share numbers for marketing",
      paragraphs: [
        "Hair 7 does not sell, rent, or share your phone number or SMS consent with third parties for their marketing. We do not add you to anyone else’s list.",
        "We use service providers only to operate the site and deliver the messages you asked for: the website host (Vercel), SMS delivery (Twilio), and short-lived storage of pending booking requests (Upstash Redis, typically seven days). Those companies process data on our behalf. They are not given your number to market their own products.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Pending booking details used for Kim’s private confirmation link expire after seven days. Kim may keep what she needs in her paper appointment book to serve you. We do not run a marketing database of phone numbers.",
      ],
    },
    {
      heading: "Calls and texts from Kim’s own phone",
      paragraphs: [
        "Kim often calls or texts you herself from the salon number after she checks her book. That is separate from the automated transactional SMS the website sends. The STOP command applies to the automated Hair 7 SMS program.",
      ],
    },
    {
      heading: "Questions",
      paragraphs: [
        "Email is not used for booking. For privacy questions, call Hair 7 at (650) 949-0796 or visit the salon.",
      ],
    },
  ],
} as const;
