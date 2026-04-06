import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { appendSDRMessage } from "@/lib/quiz";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const leadToken =
    typeof body?.leadToken === "string" ? body.leadToken.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!leadToken || !message) {
    return NextResponse.json(
      { error: "leadToken e message são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const result = await appendSDRMessage({
      bookingUrl: serverEnv.googleCalendarBookingUrl || null,
      leadToken,
      message,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("quiz.sdr.message", error);
    return NextResponse.json(
      { error: "Não foi possível avançar a conversa SDR." },
      { status: 500 },
    );
  }
}
