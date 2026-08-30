/** Sits directly above the submit button, which is where the eye returns to. */
export function SubmitError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded border-2 border-[#A12A1F] bg-[#FBEDEB] p-4 font-semibold text-[#A12A1F]"
    >
      {message}
    </p>
  );
}
