"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { PublicSDRSession } from "@/lib/quiz";

type SessionResponse =
  | {
      session: PublicSDRSession;
      state: "ready";
    }
  | {
      leadToken: string;
      message: string;
      state: "processing";
    };

type SDRChatProps = {
  leadToken: string;
};

function getResultBadgeClasses(percentage: number | null | undefined) {
  const normalizedPercentage =
    typeof percentage === "number" && Number.isFinite(percentage)
      ? percentage
      : null;

  if (normalizedPercentage !== null && normalizedPercentage >= 85) {
    return "border-emerald-200/80 bg-emerald-100 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-200";
  }

  if (normalizedPercentage !== null && normalizedPercentage >= 55) {
    return "border-sky-200/80 bg-sky-100 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-200";
  }

  if (normalizedPercentage !== null && normalizedPercentage >= 30) {
    return "border-amber-200/80 bg-amber-100 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "border-red-200/80 bg-red-100 text-red-800 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200";
}

async function loadSession(leadToken: string) {
  const response = await fetch(
    `/api/sdr/session?lead_token=${encodeURIComponent(leadToken)}`,
    {
      cache: "no-store",
    },
  );

  const body = (await response.json()) as SessionResponse | { error?: string };
  if (!response.ok && response.status !== 202) {
    const errorMessage =
      "error" in body && typeof body.error === "string"
        ? body.error
        : "Falha ao carregar a sessão SDR.";
    throw new Error(errorMessage);
  }

  return {
    body,
    status: response.status,
  };
}

export function SDRChat({ leadToken }: SDRChatProps) {
  const router = useRouter();
  const [session, setSession] = useState<PublicSDRSession | null>(null);
  const [sessionState, setSessionState] = useState<
    "loading" | "processing" | "ready" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | null = null;

    async function fetchSession() {
      try {
        const { body, status } = await loadSession(leadToken);
        if (!isMounted) {
          return;
        }

        if (
          status === 202 ||
          ("state" in body && body.state === "processing")
        ) {
          setSessionState("processing");
          timeoutId = window.setTimeout(fetchSession, 1500);
          return;
        }

        if ("session" in body) {
          setSession(body.session);
          setSessionState("ready");
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar a sessão.",
        );
        setSessionState("error");
      }
    }

    void fetchSession();

    return () => {
      isMounted = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [leadToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, sessionState]);

  const canSchedule = useMemo(() => {
    return (
      session?.status === "READY_TO_SCHEDULE" ||
      session?.bookingStatus === "READY" ||
      session?.stageKey === "ready_to_schedule"
    );
  }, [session]);

  const resultBadgeClasses = useMemo(() => {
    if (!session?.result) {
      return getResultBadgeClasses(null);
    }

    const percentage =
      session.result.percentage ??
      (typeof session.result.totalScore === "number"
        ? session.result.totalScore
        : null);

    return getResultBadgeClasses(percentage);
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/sdr/message", {
        body: JSON.stringify({
          leadToken,
          message: trimmed,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = (await response.json()) as
        | {
            error?: string;
            redirectPath: string | null;
            session: PublicSDRSession;
            shouldRedirectToBooking: boolean;
          }
        | { error?: string };

      if (!response.ok) {
        const errorMessage =
          "error" in body && typeof body.error === "string"
            ? body.error
            : "Falha ao enviar a mensagem.";
        throw new Error(errorMessage);
      }

      if (!("session" in body)) {
        throw new Error("Resposta SDR inválida.");
      }

      setMessage("");
      setSession(body.session);

      if (body.shouldRedirectToBooking && body.redirectPath) {
        const redirectPath = body.redirectPath;
        window.setTimeout(() => {
          router.push(redirectPath);
        }, 1800);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao enviar a mensagem.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!leadToken) {
    return (
      <div className="surface-panel p-8 text-center">
        <h2 className="font-serif text-2xl text-foreground">Link incompleto</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Abra esta etapa usando o link que sai do Typebot, com o
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            lead_token
          </code>
          preenchido.
        </p>
      </div>
    );
  }

  if (sessionState === "loading" || sessionState === "processing") {
    return (
      <div className="surface-panel flex min-h-130 flex-col items-center justify-center gap-4 p-8 text-center">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
        <div>
          <h2 className="font-serif text-2xl text-foreground">
            Finalizando seu diagnóstico
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            Estamos consolidando o resultado do quiz e preparando a próxima
            etapa com o SDR.
          </p>
        </div>
      </div>
    );
  }

  if (sessionState === "error" || !session) {
    return (
      <div className="surface-panel p-8 text-center">
        <h2 className="font-serif text-2xl text-foreground">
          Não foi possível abrir a conversa
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {error || "Tente novamente em alguns instantes."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.65fr]">
      <section className="surface-panel flex min-h-155 flex-col overflow-hidden p-0">
        <div className="border-b border-border/70 px-6 py-5">
          <p className="eyebrow">NEXT STEPS</p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground">
            Vamos transformar seu diagnóstico em próximo passo.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            A conversa aqui é curta. O objetivo é confirmar o contexto crítico e
            então te levar para o agendamento da análise estratégica.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {session.messages.map((entry) => (
            <div
              key={entry.id}
              className={
                entry.role === "user"
                  ? "ml-auto max-w-[88%] rounded-[1.4rem] rounded-br-md bg-foreground px-4 py-3 text-sm leading-7 text-background shadow-sm"
                  : "max-w-[88%] rounded-[1.4rem] rounded-bl-md border border-border/70 bg-card/80 px-4 py-3 text-sm leading-7 text-foreground shadow-sm"
              }
            >
              {entry.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/70 bg-card/60 px-5 py-4 sm:px-6">
          {error ? (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}

          {canSchedule ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-muted-foreground">
                Tudo certo. O próximo passo é escolher o melhor horário para a
                conversa.
              </p>
              <Button
                type="button"
                onClick={() =>
                  router.push(
                    `/agendamento?lead_token=${encodeURIComponent(leadToken)}`,
                  )
                }
              >
                Ir para agendamento
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={handleSubmit}
            >
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Responda de forma objetiva. Nossos especialistas continuam a conversa daqui."
                rows={3}
                className="min-h-28 flex-1 rounded-[1.35rem] border border-border/80 bg-background px-4 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-foreground/40"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="sm:self-end"
              >
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Enviar
              </Button>
            </form>
          )}
        </div>
      </section>

      <aside className="grid content-start gap-6">
        <section className="surface-panel p-6">
          <p className="eyebrow">SEUS DADOS</p>
          <h2 className="mt-2 font-serif text-2xl text-foreground">
            {session.lead.name || "Contato em análise"}
          </h2>
          <div className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
            <p>{session.lead.email || "E-mail pendente"}</p>
            <p>{session.lead.phoneNumber || "Telefone pendente"}</p>
          </div>
        </section>

        <section className="surface-panel p-6">
          <p className="eyebrow">Resultado</p>
          <h2 className="mt-2 font-serif text-2xl text-foreground">
            {session.result?.profileName || "Diagnóstico recebido"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {session.result?.profileSummary ||
              "Assim que o webhook consolidar a pontuação final, o resumo aparece aqui."}
          </p>
          {session.result?.totalScore !== null &&
          session.result?.totalScore !== undefined ? (
            <div
              className={`mt-5 inline-flex rounded-full border px-4 py-2 text-sm font-medium ${resultBadgeClasses}`}
            >
              IER {session.result.totalScore}/100
              {session.result.percentage !== null &&
              session.result.percentage !== undefined
                ? ` · ${session.result.percentage}%`
                : ""}
            </div>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
