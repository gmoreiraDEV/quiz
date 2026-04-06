import type { Metadata } from "next";
import { headers } from "next/headers";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { publicEnv } from "@/lib/env";
import TypebotIER from "@/components/typebot-ier";
import {
  buildTypebotPrefilledVariables,
  resolveTypebotStandardConfig,
} from "@/lib/typebot";

export const metadata: Metadata = {
  title: "Diagnóstico IER",
};

type HomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "";
  const leadToken = crypto.randomUUID();
  const sdrUrl = origin
    ? `${origin}/sdr?lead_token=${encodeURIComponent(leadToken)}`
    : `/sdr?lead_token=${encodeURIComponent(leadToken)}`;
  const typebotConfig = resolveTypebotStandardConfig({
    explicitApiHost: publicEnv.ierTypebotApiHost,
    explicitTypebot: publicEnv.ierTypebotId,
    publicUrl: publicEnv.ierTypebotPublicUrl,
  });
  const typebotPrefilledVariables = buildTypebotPrefilledVariables({
    extraVariables: {
      lead_token: leadToken,
      sdr_url: sdrUrl,
    },
    searchParams: resolvedSearchParams,
  });

  return (
    <main className="page-frame bg-lureness-glow text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-140 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_36%),radial-gradient(circle_at_top_left,rgba(236,72,153,0.10),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),transparent)] dark:bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.24),transparent_36%),radial-gradient(circle_at_top_left,rgba(236,72,153,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.24),transparent)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="pb-8">
          <LurenessMark subtitle="Indice de Eficiencia de Receita" />
        </header>

        <section className="grid flex-1 gap-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <p className="eyebrow">Diagnóstico Lureness</p>
            <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-[0.98] tracking-tight text-foreground md:text-6xl">
              Descubra onde sua operação perde receita antes de escalar
              marketing, vendas e retenção.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              Descubra em 2 minutos se sua operação está construindo patrimônio
              ou apenas &quot;moendo&quot; dinheiro para manter o crescimento.
              Responda com sinceridade.
            </p>
          </div>

          <section className="surface-panel-strong overflow-hidden p-0 shadow-xl">
            {typebotConfig ? (
              <TypebotIER
                apiHost={typebotConfig.apiHost}
                prefilledVariables={typebotPrefilledVariables}
                typebot={typebotConfig.typebot}
              />
            ) : (
              <div className="px-6 py-8">
                <div className="mx-auto max-w-2xl rounded-[1.6rem] border border-dashed border-border/80 bg-background/80 p-6 text-center">
                  <p className="eyebrow">Env pendente</p>
                  <h2 className="mt-3 font-serif text-2xl leading-tight tracking-tight text-foreground">
                    Configure a URL pública do Typebot para exibir o quiz.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Defina a env
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                      NEXT_PUBLIC_IER_TYPEBOT_PUBLIC_URL
                    </code>
                    ou informe
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                      NEXT_PUBLIC_IER_TYPEBOT_ID
                    </code>
                    e
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                      NEXT_PUBLIC_IER_TYPEBOT_API_HOST
                    </code>
                    .
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
