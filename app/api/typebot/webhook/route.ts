import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { ingestQuizTypebotSubmission } from "@/lib/quiz";

function isWebhookAuthorized(request: Request) {
  if (!serverEnv.quizTypebotWebhookSecret) {
    return true;
  }

  const url = new URL(request.url);
  const secretFromQuery = url.searchParams.get("secret")?.trim();
  const secretFromHeader =
    request.headers.get("x-quiz-webhook-secret")?.trim() ||
    request.headers.get("x-typebot-secret")?.trim();

  return (
    secretFromQuery === serverEnv.quizTypebotWebhookSecret ||
    secretFromHeader === serverEnv.quizTypebotWebhookSecret
  );
}

export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

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
    console.error("quiz.typebot.webhook", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o resultado do quiz." },
      { status: 500 },
    );
  }
}
