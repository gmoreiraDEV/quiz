import { NextResponse } from "next/server";

import {
  getGoogleCalendarTimeZone,
  hasGoogleCalendarAccessConfigured,
  listGoogleCalendarSlotDays,
} from "@/lib/google-calendar";
import { getPublicSDRSession } from "@/lib/quiz";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leadToken = url.searchParams.get("lead_token")?.trim() ?? "";

  if (!leadToken) {
    return NextResponse.json({ error: "Lead token ausente." }, { status: 400 });
  }

  const session = await getPublicSDRSession(leadToken);
  if (!session) {
    return NextResponse.json(
      { error: "Sessão SDR não encontrada." },
      { status: 404 },
    );
  }

  if (!(await hasGoogleCalendarAccessConfigured())) {
    return NextResponse.json(
      {
        error: "Google Calendar não configurado para agendamento direto.",
        session,
      },
      { status: 503 },
    );
  }

  try {
    const availability = await listGoogleCalendarSlotDays();
    return NextResponse.json({
      days: availability.days,
      session,
      timeZone: availability.timeZone || getGoogleCalendarTimeZone(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os horários disponíveis.",
      },
      { status: 500 },
    );
  }
}
