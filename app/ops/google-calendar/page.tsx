import Link from "next/link";
import { notFound } from "next/navigation";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { getQuizAppConfig } from "@/lib/app-config";
import { isGoogleOauthConfigured } from "@/lib/google-calendar";
import { isGoogleOauthAdminAuthorized } from "@/lib/google-oauth-admin";

type GoogleCalendarOpsPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function getToken(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function GoogleCalendarOpsPage({
  searchParams,
}: GoogleCalendarOpsPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = getToken(resolvedSearchParams.token);

  if (!isGoogleOauthAdminAuthorized(token)) {
    notFound();
  }

  const config = await getQuizAppConfig();
  const isConnected = Boolean(config?.googleOauthRefreshToken);
  const oauthReady = isGoogleOauthConfigured();

  return (
    <main className="page-frame bg-lureness-glow text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="pb-8">
          <LurenessMark subtitle="Operação privada · Google Calendar" />
        </header>

        <section className="surface-panel p-8">
          <p className="eyebrow">INTEGRAÇÃO PRIVADA</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-foreground">
            Conectar o calendário da operação ao quiz.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Essa rota é privada e serve apenas para autorizar uma conta Google
            uma vez. Depois disso, os leads agendam sem precisar fazer login.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-5">
              <p className="text-sm font-medium text-foreground">
                OAuth configurado no ambiente: {oauthReady ? "sim" : "não"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {oauthReady
                  ? "GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET encontrados."
                  : "Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET antes de iniciar."}
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-5">
              <p className="text-sm font-medium text-foreground">
                Refresh token salvo no app: {isConnected ? "sim" : "não"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {isConnected
                  ? `Conectado em ${config?.googleOauthConnectedAt?.toLocaleString("pt-BR") ?? "data indisponível"}.`
                  : "Ainda não existe uma conexão persistida com o Google Calendar."}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`/api/google/oauth/start?token=${encodeURIComponent(token)}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium shadow-sm transition-transform ${
                oauthReady
                  ? "bg-foreground text-background hover:-translate-y-0.5"
                  : "pointer-events-none bg-muted text-muted-foreground"
              }`}
            >
              {isConnected ? "Reconectar Google Calendar" : "Conectar Google Calendar"}
            </a>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-transparent px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/30"
            >
              Voltar para o app
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
