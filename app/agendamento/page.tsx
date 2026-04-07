import type { Metadata } from "next";
import Link from "next/link";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Agendamento",
};

type SchedulingPageProps = {
  searchParams: Promise<{ lead_token?: string | string[] }>;
};

function getLeadToken(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function SchedulingPage({
  searchParams,
}: SchedulingPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadToken = getLeadToken(resolvedSearchParams.lead_token);
  const hasBookingUrl = Boolean(publicEnv.googleCalendarBookingUrl);

  return (
    <main className="page-frame bg-lureness-glow text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="pb-8">
          <LurenessMark subtitle="Agenda estratégica Lureness" />
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="surface-panel p-6">
            <p className="eyebrow">NEXT STEPS</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-foreground">
              Escolha o melhor horário para aprofundarmos o diagnóstico.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Certifique-se de utilizar o mesmo e-mail que você usou para
              responder ao quiz, para garantir que tudo esteja alinhado para a
              nossa conversa.
            </p>
            {leadToken ? (
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
                Lead token: {leadToken}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/sdr${leadToken ? `?lead_token=${encodeURIComponent(leadToken)}` : ""}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-transparent px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30"
              >
                Voltar para a consolidação
              </Link>
              {hasBookingUrl ? (
                <a
                  href={publicEnv.googleCalendarBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Abrir agenda em nova aba
                </a>
              ) : null}
            </div>
          </div>

          <section className="overflow-hidden">
            {hasBookingUrl ? (
              <div className="surface-panel overflow-hidden p-3 sm:p-4">
                <iframe
                  src={publicEnv.googleCalendarBookingUrl}
                  title="Agendamento Google Calendar"
                  width="100%"
                  height="760"
                  className="min-h-190 w-full rounded-[1.4rem] border-0 bg-background"
                />
              </div>
            ) : (
              <div className="px-6 py-8">
                <div className="mx-auto max-w-2xl rounded-[1.6rem] border border-dashed border-border/80 bg-background/80 p-6 text-center">
                  <p className="eyebrow">Env pendente</p>
                  <h2 className="mt-3 font-serif text-2xl leading-tight tracking-tight text-foreground">
                    Configure a agenda inline para finalizar esse fluxo.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Defina a env
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                      NEXT_PUBLIC_GOOGLE_CALENDAR_BOOKING_URL
                    </code>
                    com a URL do iframe inline gerada pelo Google Calendar.
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
