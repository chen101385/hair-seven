import { NextResponse } from "next/server";
import { checkPin } from "@/lib/closed-days";
import {
  CLOSED_COOKIE,
  CLOSED_COOKIE_MAX_AGE,
  createSessionToken,
} from "@/lib/closed-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Please enter the code." }, { status: 400 });
  }

  const code =
    typeof raw === "object" && raw !== null && "code" in raw
      ? String((raw as { code: unknown }).code).replace(/\D/g, "")
      : "";
  const result = await checkPin(code);
  if (result !== "ok") {
    return NextResponse.json(
      {
        ok: false,
        message:
          result === "expired"
            ? "That code has expired. Please ask for a new one."
            : "That code is not right.",
      },
      { status: 401 },
    );
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Sign-in is not available right now." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CLOSED_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLOSED_COOKIE_MAX_AGE,
  });
  return response;
}
