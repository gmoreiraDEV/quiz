"use client";

import { CalendarDays, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { PublicSDRSession } from "@/lib/quiz";

type BookingSlot = {
  end: string;
  label: string;
  start: string;
};

type BookingDay = {
  dateKey: string;
  label: string;
  slots: BookingSlot[];
};

type BookingSlotsResponse =
  | {
      days: BookingDay[];
      session: PublicSDRSession;
      timeZone: string;
    }
  | {
      error: string;
      session?: PublicSDRSession;
    };

type BookingScheduleResponse =
  | {
      session: PublicSDRSession;
      success: true;
    }
  | {
      error: string;
      session?: PublicSDRSession;
    };

type BookingSchedulerProps = {
  leadToken: string;
};

function formatDateTime(dateIso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    weekday: "long",
  }).format(new Date(dateIso));
}

export function BookingScheduler({ leadToken }: BookingSchedulerProps) {
  const [days, setDays] = useState<BookingDay[]>([]);
  const [error, setError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [session, setSession] = useState<PublicSDRSession | null>(null);
  const [timeZone, setTimeZone] = useState("America/Sao_Paulo");

  useEffect(() => {
    let isMounted = true;

    async function loadAvailability() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/booking/slots?lead_token=${encodeURIComponent(leadToken)}`,
          {
            cache: "no-store",
          },
        );
        const body = (await response.json()) as BookingSlotsResponse;

        if (!response.ok) {
          const message =
            "error" in body ? body.error : "Falha ao carregar horários.";
          throw new Error(message);
        }

        if (
          !isMounted ||
          !("days" in body) ||
          !("session" in body) ||
          !body.session
        ) {
          return;
        }

        setDays(body.days);
        setSession(body.session);
        setTimeZone(body.timeZone);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar horários.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [leadToken]);

  const scheduledBooking = session?.booking.scheduledFor
    ? {
        eventUrl: session.booking.eventUrl,
        meetingUrl: session.booking.meetingUrl,
        scheduledFor: session.booking.scheduledFor,
      }
    : null;

  const canSchedule = useMemo(() => {
    return (
      session?.status === "READY_TO_SCHEDULE" ||
      session?.stageKey === "ready_to_schedule" ||
      session?.bookingStatus === "READY"
    );
  }, [session]);

  async function handleBook(slotStart: string) {
    if (!leadToken || isBooking) {
      return;
    }

    setIsBooking(true);
    setSelectedSlotStart(slotStart);
    setError("");

    try {
      const response = await fetch("/api/booking/schedule", {
        body: JSON.stringify({
          leadToken,
          start: slotStart,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = (await response.json()) as BookingScheduleResponse;

      if (!response.ok) {
        const message =
          "error" in body ? body.error : "Falha ao criar agendamento.";
        throw new Error(message);
      }

      if (!("session" in body) || !body.session) {
        throw new Error("Resposta de agendamento inválida.");
      }

      setSession(body.session);
      setDays([]);
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : "Falha ao criar agendamento.",
      );
    } finally {
      setIsBooking(false);
      setSelectedSlotStart(null);
    }
  }

  if (isLoading) {
    return (
      <div className="surface-panel-strong flex min-h-130 flex-col items-center justify-center gap-4 p-8 text-center shadow-xl">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
        <div>
          <p className="eyebrow">AGENDAMENTO</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
            Buscando os melhores horários disponíveis.
          </h2>
        </div>
      </div>
    );
  }

  if (scheduledBooking) {
    return (
      <div className="surface-panel-strong min-h-130 p-8 shadow-xl">
        <p className="eyebrow">AGENDAMENTO CONFIRMADO</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
          Sua conversa estratégica já está reservada.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Horário confirmado para {formatDateTime(scheduledBooking.scheduledFor)}.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {scheduledBooking.meetingUrl ? (
            <Button
              type="button"
              onClick={() =>
                window.open(scheduledBooking.meetingUrl!, "_blank", "noopener,noreferrer")
              }
            >
              Abrir link do Meet
            </Button>
          ) : null}
          {scheduledBooking.eventUrl ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                window.open(scheduledBooking.eventUrl!, "_blank", "noopener,noreferrer")
              }
            >
              Abrir evento no Google Calendar
            </Button>
          ) : null}
          <Link
            href={`/sdr?lead_token=${encodeURIComponent(leadToken)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-transparent px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30"
          >
            Voltar para a conversa
          </Link>
        </div>
      </div>
    );
  }

  if (!canSchedule) {
    return (
      <div className="surface-panel-strong min-h-130 p-8 shadow-xl">
        <p className="eyebrow">PRÉ-REQUISITO</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
          O agendamento ainda não foi liberado.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Termine a qualificação com o SDR para liberar os horários da agenda.
        </p>
        <div className="mt-8">
          <Link
            href={`/sdr?lead_token=${encodeURIComponent(leadToken)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Voltar para o SDR
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel-strong min-h-130 p-6 shadow-xl">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">HORÁRIOS DISPONÍVEIS</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
            Escolha o melhor momento para a conversa estratégica.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Todos os horários abaixo já consideram o calendário principal da
            operação. Fuso: {timeZone}.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {days.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-border/80 bg-background/80 p-8 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-4 font-serif text-2xl text-foreground">
            Nenhum horário disponível agora.
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            A agenda está cheia no horizonte atual. Tente novamente em alguns
            instantes ou ajuste a janela de disponibilidade no calendário.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {days.map((day) => (
            <section
              key={day.dateKey}
              className="rounded-[1.6rem] border border-border/70 bg-background/80 p-5"
            >
              <h3 className="font-serif text-2xl text-foreground">{day.label}</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {day.slots.map((slot) => {
                  const isPending = isBooking && selectedSlotStart === slot.start;
                  return (
                    <Button
                      key={slot.start}
                      type="button"
                      variant="outline"
                      disabled={isBooking}
                      onClick={() => void handleBook(slot.start)}
                      className="min-w-28"
                    >
                      {isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      {slot.label}
                    </Button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
