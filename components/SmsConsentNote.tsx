import Link from "next/link";
import { privacy } from "@/content/privacy";

/** Point-of-collection SMS disclosure for A2P 10DLC, plus the policy link. */
export function SmsConsentNote() {
  return (
    <p className="mt-2 text-small text-ink/75">
      By sending, you agree that Hair 7 may text you about this request.
      Message frequency varies. Message and data rates may apply. Reply STOP
      to opt out or HELP for help. Consent is not a condition of service. We
      do not share your number with third parties for their marketing.{" "}
      <Link
        href={privacy.path}
        className="font-semibold underline underline-offset-4"
      >
        Privacy policy
      </Link>
      .
    </p>
  );
}
