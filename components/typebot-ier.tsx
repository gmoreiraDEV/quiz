"use client";

import {
  Standard,
  setPrefilledVariables,
  type TypebotAnswerEvent,
  type TypebotPrefilledVariables,
} from "@typebot.io/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  computeIerSubmission,
  getIerAnswerFromTypebot,
  getIerContactFieldFromBlockId,
  IER_DIMENSIONS,
  type IerNormalizedAnswer,
} from "@/lib/ier";

type TypebotIERProps = {
  apiHost: string;
  prefilledVariables: TypebotPrefilledVariables;
  typebot: string;
};

type ContactFieldName = "email" | "phone_number" | "respondent_name";
type ContactFieldState = Partial<Record<ContactFieldName, string>>;

const STANDARD_ID = "lureness-ier-standard";

function normalizeVariableValue(
  value: string | number | boolean | undefined,
): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function buildCompletionPayload(args: {
  answersByBlockId: Map<string, IerNormalizedAnswer>;
  contact: ContactFieldState;
  prefilledVariables: TypebotPrefilledVariables;
  typebot: string;
}) {
  const orderedAnswers = IER_DIMENSIONS.map((dimension) =>
    args.answersByBlockId.get(dimension.typebotBlockId),
  ).filter((answer): answer is IerNormalizedAnswer => Boolean(answer));

  const respondentName = args.contact.respondent_name?.trim() ?? "";
  const email = args.contact.email?.trim() ?? "";
  const phoneNumber = args.contact.phone_number?.trim() ?? "";
  const leadToken = normalizeVariableValue(args.prefilledVariables.lead_token);

  if (
    orderedAnswers.length !== IER_DIMENSIONS.length ||
    !respondentName ||
    !email ||
    !phoneNumber ||
    !leadToken
  ) {
    return null;
  }

  const computed = computeIerSubmission(orderedAnswers);
  const submissionId = crypto.randomUUID();

  const variables: Record<string, string | number> = {
    email,
    ier_percentage: computed.percentage,
    ier_total_score: computed.totalScore,
    lead_token: leadToken,
    max_score: computed.maxScore,
    phone_number: phoneNumber,
    profile_code: computed.profileCode,
    profile_name: computed.profileName,
    profile_summary: computed.profileSummary,
    respondent_name: respondentName,
  };

  const strongestPillarName = computed.strongestPillarName?.trim();
  if (strongestPillarName) {
    variables.strongest_pillar_name = strongestPillarName;
  }

  const weakestPillarName = computed.weakestPillarName?.trim();
  if (weakestPillarName) {
    variables.weakest_pillar_name = weakestPillarName;
  }

  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "ref",
    "sdr_url",
  ] as const) {
    const value = normalizeVariableValue(args.prefilledVariables[key]);
    if (value) {
      variables[key] = value;
    }
  }

  return {
    answers: orderedAnswers.map((answer) => ({
      answer: `${answer.option}) ${answer.text}`,
      group: answer.group,
      option: answer.option,
      points: answer.points,
      question: answer.question,
      text: answer.text,
      title: answer.title,
    })),
    metadata: {
      source: "quiz-standard",
      submitted_at: new Date().toISOString(),
      typebot: args.typebot,
    },
    submission_id: submissionId,
    variables,
  };
}

export default function TypebotIER({
  apiHost,
  prefilledVariables,
  typebot,
}: TypebotIERProps) {
  const router = useRouter();
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const answersRef = useRef(new Map<string, IerNormalizedAnswer>());
  const contactRef = useRef<ContactFieldState>({});
  const isSubmittingRef = useRef(false);
  const normalizedVariables = useMemo(
    () => prefilledVariables,
    [prefilledVariables],
  );

  useEffect(() => {
    if (Object.keys(normalizedVariables).length === 0) {
      return;
    }

    setPrefilledVariables(normalizedVariables, { id: STANDARD_ID });
  }, [normalizedVariables]);

  const handleAnswer = ({ blockId, message }: TypebotAnswerEvent) => {
    const mappedAnswer = getIerAnswerFromTypebot(blockId, message);
    if (mappedAnswer) {
      answersRef.current.set(blockId, mappedAnswer);
      return;
    }

    const contactField = getIerContactFieldFromBlockId(blockId);
    if (contactField) {
      contactRef.current[contactField] = message.trim();
    }
  };

  const handleEnd = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const payload = buildCompletionPayload({
      answersByBlockId: answersRef.current,
      contact: contactRef.current,
      prefilledVariables: normalizedVariables,
      typebot,
    });

    if (!payload) {
      setCompletionError(
        "O quiz terminou sem todos os dados necessários para registrar o diagnóstico.",
      );
      return;
    }

    isSubmittingRef.current = true;
    setCompletionError(null);
    setIsCompleting(true);

    try {
      const response = await fetch("/api/quiz/complete", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; sdrPath?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível registrar o resultado do quiz.",
        );
      }

      const fallbackSdrUrl = normalizeVariableValue(normalizedVariables.sdr_url);
      const redirectTarget =
        data?.sdrPath ||
        (fallbackSdrUrl ? new URL(fallbackSdrUrl, window.location.origin).pathname + new URL(fallbackSdrUrl, window.location.origin).search : "/sdr");

      router.push(redirectTarget);
    } catch (error) {
      console.error("typebot.quiz.complete", error);
      setCompletionError(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o resultado do quiz.",
      );
      isSubmittingRef.current = false;
      setIsCompleting(false);
      return;
    }

    setIsCompleting(false);
  };

  return (
    <div className="relative">
      <Standard
        id={STANDARD_ID}
        apiHost={apiHost}
        onAnswer={handleAnswer}
        onEnd={handleEnd}
        prefilledVariables={normalizedVariables}
        style={{ width: "100%", height: "calc(100vh - 10rem)" }}
        typebot={typebot}
      />

      {isCompleting ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
          <div className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
            Registrando seu diagnóstico...
          </div>
        </div>
      ) : null}

      {completionError ? (
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm text-red-700 shadow-lg">
          {completionError}
        </div>
      ) : null}
    </div>
  );
}
