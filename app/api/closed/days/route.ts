import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listClosedDays, replaceClosedDays, setDateClosed } from "@/lib/closed-days";
import { CLOSED_COOKIE, verifySessionToken } from "@/lib/closed-session";

export const runtime = "nodejs";

async function signedIn(): Promise<boolean> {
  const token = (await cookies()).get(CLOSED_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, message: "Please enter the code first." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, closed: await listClosedDays() });
}

export async function POST(request: Request) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, message: "Please enter the code first." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Please try that again." }, { status: 400 });
  }

  const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const next = Array.isArray(body.dates)
    ? await replaceClosedDays(body.dates.filter((date): date is string => typeof date === "string"))
    : await setDateClosed(
        typeof body.date === "string" ? body.date : "",
        body.closed === true,
      );
  if (!next) {
    return NextResponse.json(
      { ok: false, message: "That day cannot be changed." },
      { status: 400 },
    );
  }

  revalidatePath("/");
  revalidatePath("/book");
  return NextResponse.json({ ok: true, closed: next });
}
