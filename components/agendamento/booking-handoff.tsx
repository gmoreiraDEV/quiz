"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type BookingHandoffProps = {
  bookingUrl: string;
};

export function BookingHandoff({ bookingUrl }: BookingHandoffProps) {
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.location.assign(bookingUrl);
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bookingUrl]);

  return (
    <div className="surface-panel-strong flex min-h-130 flex-col items-center justify-center gap-5 p-8 text-center shadow-xl">
      <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      <div className="max-w-2xl">
        <p className="eyebrow">AGENDAMENTO</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
          Abrindo a agenda estratégica da Lureness.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          O Google Calendar não permite incorporação dentro da página. Estamos
          te levando agora para a agenda externa para você concluir a reserva.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => {
            setIsRedirecting(false);
            window.location.assign(bookingUrl);
          }}
        >
          Abrir agenda agora
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.open(bookingUrl, "_blank", "noopener,noreferrer")}
        >
          Abrir em nova aba
        </Button>
      </div>

      {isRedirecting ? (
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
          Redirecionando em instantes
        </p>
      ) : null}
    </div>
  );
}
