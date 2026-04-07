import Link from "next/link";

import { LurenessMark } from "@/components/brand/lureness-mark";

export default function GoogleCalendarConnectedPage() {
  return (
    <main className="page-frame bg-lureness-glow text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="pb-8">
          <LurenessMark subtitle="Operação privada · Google Calendar" />
        </header>

        <section className="surface-panel p-8 text-center">
          <p className="eyebrow">CONECTADO</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-foreground">
            O refresh token do Google Calendar foi salvo.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            A partir de agora, o app pode consultar disponibilidade e criar
            eventos sem pedir login para o lead.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Voltar para o app
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
