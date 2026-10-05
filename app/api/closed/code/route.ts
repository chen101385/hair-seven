import { NextResponse } from "next/server";
import {
  closedDaysPhone,
  newPin,
  reserveCodeSend,
  storePin,
} from "@/lib/closed-days";
import { sendPlainSms } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST() {
  const reserved = await reserveCodeSend();
  if (!reserved.ok) {
    return NextResponse.json({ ok: false, message: reserved.message }, { status: 429 });
  }

  const phone = closedDaysPhone();
  const code = newPin();
  const stored = await storePin(code);
  if (!phone || !stored) {
    return NextResponse.json(
      { ok: false, message: "A code cannot be sent right now. Please try again later." },
      { status: 503 },
    );
  }

  try {
    await sendPlainSms(phone, `Hair 7 code: ${code}. It expires in 10 minutes.`);
  } catch (error) {
    console.error("[hair-seven] closed-days code failed:", error);
    return NextResponse.json(
      { ok: false, message: "The code did not send. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
