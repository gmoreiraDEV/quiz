import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { ingestQuizTypebotSubmission } from "@/lib/quiz";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const result = await ingestQuizTypebotSubmission({
      bookingUrl: serverEnv.googleCalendarBookingUrl || null,
      payload,
    });

    return NextResponse.json({
      leadToken: result.leadToken,
      ok: true,
      sdrPath: `/sdr?lead_token=${encodeURIComponent(result.leadToken)}`,
      submissionId: result.submissionId,
    });
  } catch (error) {
    console.error("quiz.complete", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o resultado do quiz." },
      { status: 500 },
    );
  }
}
