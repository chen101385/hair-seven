import { site } from "@/content/site";
import { PhoneIcon } from "./icons";

/**
 * The one piece of chrome worth the screen space for this audience: the two
 * things anyone actually came here to do, always within thumb reach.
 * Mobile only — on a desktop the header buttons are already visible.
 */
export function MobileBar() {
  return (
    <nav
      aria-label="Contact Hair Seven"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-awning/30 bg-paper px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(34,48,58,0.14)] md:hidden"
    >
      <div className="flex gap-3">
        <a
          href={`tel:${site.phoneHref}`}
          className="btn btn-primary basis-[36%] px-3 text-[1.0625rem] leading-tight"
        >
          <PhoneIcon />
          Call
        </a>
        <a
          href="/#book"
          className="btn btn-secondary flex-1 px-3 text-[1.0625rem] leading-tight"
        >
          Request appointment
        </a>
      </div>
    </nav>
  );
}
