/**
 * Point-of-collection SMS copy. Twilio reviewers screenshot this language
 * next to an unchecked consent checkbox, so keep it aligned with /privacy
 * and /terms.
 */

export const smsProgram = {
  checkboxLabel:
    "Yes, I would like to receive automated text messages from Hair 7 about this request. Hair 7 will text a confirmation of the time Kim booked, or alternative times if that window is taken. I understand I will typically receive 1–2 messages per request. Consent is not a condition of service.",
  frequency:
    "Message frequency varies. A typical request receives 1–2 texts.",
  rates: "Message and data rates may apply.",
  helpStop:
    "Reply HELP for help or STOP to cancel at any time.",
  noShare:
    "We do not share your number with third parties for their marketing.",
} as const;
