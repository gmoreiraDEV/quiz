import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { publicEnv } from "@/lib/env";
import { buildTypebotViewerUrl } from "@/lib/typebot";

export const metadata: Metadata = {
  title: "Diagnóstico IER",
};

type HomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const typebotViewerUrl = buildTypebotViewerUrl({
    publicUrl: publicEnv.ierTypebotPublicUrl,
    searchParams: resolvedSearchParams,
  });
  const hasTypebotEmbed = Boolean(typebotViewerUrl);

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
            {hasTypebotEmbed ? (
              <>
                <iframe
                  src={typebotViewerUrl}
                  title="Diagnóstico IER da Lureness"
                  className="block h-[calc(100vh-10rem)] min-h-[780px] w-full border-0 bg-background"
                  allow="clipboard-write; microphone"
                />
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/70 bg-card/70 px-6 py-4">
                  <a
                    href={typebotViewerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-transparent px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30"
                  >
                    Abrir direto
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </>
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
                    com a URL pública do bot publicado.
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
