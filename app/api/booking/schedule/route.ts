import { NextResponse } from "next/server";

import { createGoogleCalendarBooking } from "@/lib/google-calendar";
import {
  confirmBookingForLead,
  getBookingSessionRecord,
  getPublicSDRSession,
} from "@/lib/quiz";

type BookingRequestBody = {
  leadToken?: string;
  start?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as BookingRequestBody | null;
  const leadToken = body?.leadToken?.trim() ?? "";
  const start = body?.start?.trim() ?? "";

  if (!leadToken || !start) {
    return NextResponse.json(
      { error: "Lead token e horário são obrigatórios." },
      { status: 400 },
    );
  }

  const session = await getBookingSessionRecord(leadToken);
  if (!session) {
    return NextResponse.json(
      { error: "Sessão SDR não encontrada." },
      { status: 404 },
    );
  }

  if (session.bookingStatus === "SCHEDULED") {
    const updatedSession = await getPublicSDRSession(leadToken);

    return NextResponse.json(
      {
        error: "Essa sessão já possui um agendamento confirmado.",
        session: updatedSession,
      },
      { status: 409 },
    );
  }

  if (
    session.status !== "READY_TO_SCHEDULE" &&
    session.stageKey !== "ready_to_schedule"
  ) {
    return NextResponse.json(
      { error: "O lead ainda não está pronto para agendamento." },
      { status: 409 },
    );
  }

  try {
    const booking = await createGoogleCalendarBooking({
      leadEmail: session.lead.email,
      leadName: session.lead.name,
      leadPhoneNumber: session.lead.phoneNumber,
      leadToken,
      profileName: session.submission?.profileName ?? null,
      score: session.submission?.totalScore ?? null,
      sessionId: session.id,
      startIso: start,
      submissionId: session.submissionId,
      summary: session.summary ?? session.submission?.profileSummary ?? null,
    });

    const updatedSession = await confirmBookingForLead({
      bookingMetadata: booking.bookingMetadata,
      eventId: booking.eventId,
      eventUrl: booking.eventUrl,
      leadToken,
      meetingUrl: booking.meetingUrl,
      scheduledFor: booking.scheduledFor,
      scheduledUntil: booking.scheduledUntil,
    });

    return NextResponse.json({
      session: updatedSession,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o agendamento.",
      },
      { status: 500 },
    );
  }
}
