import {
  Prisma,
  QuizBookingStatus,
  QuizSDRMessageRole,
  QuizSDRSessionStatus,
} from "@/lib/generated/prisma/client";
import {
  advanceSDRAgent,
  createOpeningSDRMessage,
} from "@/lib/ia/sdr/graph";
import type { LeadContext } from "@/lib/ia/sdr/types/agent-state";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

type NormalizedTypebotPayload = {
  answers: JsonRecord[];
  externalSubmissionId: string | null;
  fbclid: string | null;
  gclid: string | null;
  leadToken: string;
  maxScore: number | null;
  metadata: JsonRecord;
  percentage: number | null;
  phoneNumber: string | null;
  profileCode: string | null;
  profileName: string | null;
  profileSummary: string | null;
  rawPayload: JsonRecord;
  referrerCode: string | null;
  respondentEmail: string | null;
  respondentName: string | null;
  resultId: string | null;
  strongestPillarName: string | null;
  totalScore: number | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmMedium: string | null;
  utmSource: string | null;
  utmTerm: string | null;
  variables: JsonRecord;
  weakestPillarName: string | null;
};

type QuizResultBand = {
  code: string;
  description: string;
  title: string;
};

type PersistedHistoryMessage = {
  content: string;
  role: "assistant" | "user";
};

export type PublicSDRMessage = {
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "system" | "user";
};

export type PublicSDRSession = {
  bookingStatus: string;
  bookingUrl: string | null;
  lead: {
    email: string | null;
    name: string | null;
    phoneNumber: string | null;
  };
  leadToken: string;
  messages: PublicSDRMessage[];
  result: {
    percentage: number | null;
    profileName: string | null;
    profileSummary: string | null;
    totalScore: number | null;
  } | null;
  stageKey: string | null;
  status: string;
  submissionId: string | null;
};

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

function getCollectionRecord(value: unknown): JsonRecord {
  if (Array.isArray(value)) {
    return value.reduce<JsonRecord>((accumulator, item) => {
      const record = asRecord(item);
      const key =
        readString(record.name) ||
        readString(record.key) ||
        readString(record.id) ||
        readString(record.variable);

      if (!key) {
        return accumulator;
      }

      accumulator[key] =
        record.value ?? record.content ?? record.answer ?? record.text ?? "";
      return accumulator;
    }, {});
  }

  return asRecord(value);
}

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function readInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function resolveStringField(
  keys: string[],
  ...sources: Array<JsonRecord | undefined>
): string | null {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const key of keys) {
      const value = readString(source[key]);
      if (value) {
        return value;
      }
    }
  }

  return null;
}

function resolveIntField(
  keys: string[],
  ...sources: Array<JsonRecord | undefined>
): number | null {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const key of keys) {
      const value = readInt(source[key]);
      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

function resolveIerBand(totalScore: number | null): QuizResultBand {
  if (totalScore !== null && totalScore >= 85) {
    return {
      code: "operacao_elite",
      description:
        "Sua máquina está azeitada. O próximo passo é escala com previsibilidade e ganho de margem.",
      title: "Operação Elite",
    };
  }

  if (totalScore !== null && totalScore >= 55) {
    return {
      code: "vazamento_de_margem",
      description:
        "Você cresce, mas ainda desperdiça margem na atração, conversão ou retenção.",
      title: "Vazamento de Margem",
    };
  }

  if (totalScore !== null && totalScore >= 30) {
    return {
      code: "risco_operacional",
      description:
        "Seus silos e gargalos operacionais estão comprimindo o lucro e o caixa.",
      title: "Risco Operacional",
    };
  }

  return {
    code: "caos_de_receita",
    description:
      "A operação reage ao problema do dia. Sem ajuste estrutural, crescer tende a piorar a perda.",
    title: "Caos de Receita",
  };
}

function parsePersistedHistoryMessages(
  history: Array<{
    content: string;
    role: string;
  }>,
) {
  return history.reduce<PersistedHistoryMessage[]>((accumulator, item) => {
    if (item.role !== "assistant" && item.role !== "user") {
      return accumulator;
    }

    accumulator.push({
      content: item.content,
      role: item.role,
    });
    return accumulator;
  }, []);
}

function buildAgentHistory(
  session: NonNullable<Awaited<ReturnType<typeof getSDRSessionRecord>>>,
  pendingUserMessage?: string,
) {
  const persistedHistory = parsePersistedHistoryMessages(
    session.messages.map((message) => ({
      content: message.content,
      role: message.role.toLowerCase(),
    })),
  );

  if (!pendingUserMessage) {
    return persistedHistory;
  }

  return [
    ...persistedHistory,
    {
      content: pendingUserMessage,
      role: "user" as const,
    },
  ];
}

function buildAgentAnswers(
  answers: Prisma.JsonValue | null | undefined,
): LeadContext["answers"] {
  if (!Array.isArray(answers)) {
    return [];
  }

  return answers.reduce<LeadContext["answers"]>((accumulator, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return accumulator;
    }

    const record = item as Record<string, unknown>;
    const group = typeof record.group === "string" ? record.group : "";
    const option = typeof record.option === "string" ? record.option : "";
    const points =
      typeof record.points === "number" && Number.isFinite(record.points)
        ? record.points
        : 0;

    if (
      (group === "marca" ||
        group === "marketing" ||
        group === "sla" ||
        group === "dados" ||
        group === "retencao") &&
      (option === "A" || option === "B" || option === "C" || option === "D")
    ) {
      accumulator.push({
        group,
        option,
        points,
      });
    }

    return accumulator;
  }, []);
}

type AgentInputSession = NonNullable<
  Awaited<ReturnType<typeof getSDRSessionRecord>>
>;

async function buildOpeningMessageForSession(args: {
  bookingUrl: string | null;
  session: AgentInputSession;
}) {
  return createOpeningSDRMessage({
    answers: buildAgentAnswers(args.session.submission?.answers),
    bookingUrl: args.bookingUrl ?? undefined,
    history: buildAgentHistory(args.session),
    name:
      args.session.lead.name ||
      args.session.submission?.respondentName ||
      "Lead",
    profileSummary: args.session.submission?.profileSummary ?? undefined,
    score: args.session.submission?.totalScore ?? 0,
    sessionStageKey: args.session.stageKey ?? "after_quiz",
    weakestPillarName: args.session.submission?.weakestPillarName ?? undefined,
  });
}

async function generateSDRReplyForSession(args: {
  bookingUrl: string | null;
  leadMessage: string;
  session: AgentInputSession;
}) {
  return advanceSDRAgent({
    answers: buildAgentAnswers(args.session.submission?.answers),
    bookingUrl: args.bookingUrl ?? undefined,
    history: buildAgentHistory(args.session, args.leadMessage),
    leadMessage: args.leadMessage,
    name:
      args.session.lead.name ||
      args.session.submission?.respondentName ||
      "Lead",
    profileSummary: args.session.submission?.profileSummary ?? undefined,
    score: args.session.submission?.totalScore ?? 0,
    sessionStageKey: args.session.stageKey ?? "after_quiz",
    weakestPillarName: args.session.submission?.weakestPillarName ?? undefined,
  });
}

function toInputJsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function normalizeTypebotPayload(input: unknown): NormalizedTypebotPayload {
  const body = asRecord(input);
  const rawPayload = asRecord(body.payload);
  const metadata = getCollectionRecord(body.metadata);
  const variables = getCollectionRecord(body.variables);
  const answers = asArray(body.answers).map(asRecord);
  const answersRecord = getCollectionRecord(body.answers);

  const externalSubmissionId =
    readString(body.submission_id) ||
    readString(body.submissionId) ||
    readString(body.result_id) ||
    readString(body.resultId) ||
    resolveStringField(
      ["submission_id", "submissionId", "result_id", "resultId"],
      variables,
      metadata,
      rawPayload,
    ) ||
    null;

  const leadToken =
    resolveStringField(
      ["lead_token", "leadToken"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ) ||
    externalSubmissionId ||
    crypto.randomUUID();

  const totalScore = resolveIntField(
    ["ier_total_score", "total_score", "ierScore"],
    variables,
    metadata,
    rawPayload,
    answersRecord,
  );
  const maxScore = resolveIntField(
    ["max_score", "ier_max_score"],
    variables,
    metadata,
    rawPayload,
    answersRecord,
  );
  const percentage =
    resolveIntField(
      ["ier_percentage", "percentage"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ) ??
    (totalScore !== null && maxScore
      ? Math.round((totalScore / maxScore) * 100)
      : null);
  const resultBand = resolveIerBand(totalScore);

  return {
    answers,
    externalSubmissionId,
    fbclid: resolveStringField(["fbclid"], variables, metadata, rawPayload),
    gclid: resolveStringField(["gclid"], variables, metadata, rawPayload),
    leadToken,
    maxScore,
    metadata,
    percentage,
    phoneNumber: resolveStringField(
      ["phone_number", "phone", "telefone"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ),
    profileCode:
      resolveStringField(
        ["profile_code"],
        variables,
        metadata,
        rawPayload,
        answersRecord,
      ) ?? resultBand.code,
    profileName:
      resolveStringField(
        ["profile_name"],
        variables,
        metadata,
        rawPayload,
        answersRecord,
      ) ?? resultBand.title,
    profileSummary:
      resolveStringField(
        ["profile_summary"],
        variables,
        metadata,
        rawPayload,
        answersRecord,
      ) ?? resultBand.description,
    rawPayload: body,
    referrerCode: resolveStringField(["ref"], variables, metadata, rawPayload),
    respondentEmail: resolveStringField(
      ["email", "respondent_email"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ),
    respondentName: resolveStringField(
      ["respondent_name", "name", "nome"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ),
    resultId: readString(body.result_id) || readString(body.resultId),
    strongestPillarName: resolveStringField(
      ["strongest_pillar_name"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ),
    totalScore,
    utmCampaign: resolveStringField(
      ["utm_campaign"],
      variables,
      metadata,
      rawPayload,
    ),
    utmContent: resolveStringField(
      ["utm_content"],
      variables,
      metadata,
      rawPayload,
    ),
    utmMedium: resolveStringField(
      ["utm_medium"],
      variables,
      metadata,
      rawPayload,
    ),
    utmSource: resolveStringField(
      ["utm_source"],
      variables,
      metadata,
      rawPayload,
    ),
    utmTerm: resolveStringField(["utm_term"], variables, metadata, rawPayload),
    variables,
    weakestPillarName: resolveStringField(
      ["weakest_pillar_name"],
      variables,
      metadata,
      rawPayload,
      answersRecord,
    ),
  };
}

async function getSDRSessionRecord(leadToken: string) {
  return prisma.quizSDRSession.findFirst({
    where: {
      lead: {
        leadToken,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      lead: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      submission: true,
    },
  });
}

function serializeSession(
  session: Awaited<ReturnType<typeof getSDRSessionRecord>> | null,
) {
  if (!session) {
    return null;
  }

  return {
    bookingStatus: session.bookingStatus,
    bookingUrl: session.bookingUrl,
    lead: {
      email: session.lead.email,
      name: session.lead.name,
      phoneNumber: session.lead.phoneNumber,
    },
    leadToken: session.lead.leadToken,
    messages: session.messages.map((message) => ({
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      id: message.id,
      role: message.role.toLowerCase() as PublicSDRMessage["role"],
    })),
    result: session.submission
      ? {
          percentage: session.submission.percentage,
          profileName: session.submission.profileName,
          profileSummary: session.submission.profileSummary,
          totalScore: session.submission.totalScore,
        }
      : null,
    stageKey: session.stageKey,
    status: session.status,
    submissionId: session.submissionId,
  } satisfies PublicSDRSession;
}

export async function ingestQuizTypebotSubmission(args: {
  bookingUrl: string | null;
  payload: unknown;
}) {
  const normalized = normalizeTypebotPayload(args.payload);
  const completedAt = new Date();

  const lead = await prisma.quizLead.upsert({
    where: {
      leadToken: normalized.leadToken,
    },
    update: {
      email: normalized.respondentEmail ?? undefined,
      fbclid: normalized.fbclid ?? undefined,
      gclid: normalized.gclid ?? undefined,
      name: normalized.respondentName ?? undefined,
      phoneNumber: normalized.phoneNumber ?? undefined,
      referrerCode: normalized.referrerCode ?? undefined,
      utmCampaign: normalized.utmCampaign ?? undefined,
      utmContent: normalized.utmContent ?? undefined,
      utmMedium: normalized.utmMedium ?? undefined,
      utmSource: normalized.utmSource ?? undefined,
      utmTerm: normalized.utmTerm ?? undefined,
    },
    create: {
      email: normalized.respondentEmail,
      fbclid: normalized.fbclid,
      gclid: normalized.gclid,
      leadToken: normalized.leadToken,
      name: normalized.respondentName,
      phoneNumber: normalized.phoneNumber,
      referrerCode: normalized.referrerCode,
      utmCampaign: normalized.utmCampaign,
      utmContent: normalized.utmContent,
      utmMedium: normalized.utmMedium,
      utmSource: normalized.utmSource,
      utmTerm: normalized.utmTerm,
    },
  });

  const sharedSubmissionData = {
    answers: toInputJsonValue(normalized.answers),
    completedAt,
    email: normalized.respondentEmail,
    leadId: lead.id,
    maxScore: normalized.maxScore,
    metadata: toInputJsonValue(normalized.metadata),
    percentage: normalized.percentage,
    phoneNumber: normalized.phoneNumber,
    profileCode: normalized.profileCode,
    profileName: normalized.profileName,
    profileSummary: normalized.profileSummary,
    rawPayload: toInputJsonValue(normalized.rawPayload),
    respondentName: normalized.respondentName,
    strongestPillarName: normalized.strongestPillarName,
    totalScore: normalized.totalScore,
    typebotResultId: normalized.resultId,
    variables: toInputJsonValue(normalized.variables),
    weakestPillarName: normalized.weakestPillarName,
  };

  const submission = normalized.externalSubmissionId
    ? await prisma.quizSubmission.upsert({
        where: {
          externalSubmissionId: normalized.externalSubmissionId,
        },
        update: sharedSubmissionData,
        create: {
          ...sharedSubmissionData,
          externalSubmissionId: normalized.externalSubmissionId,
        },
      })
    : await prisma.quizSubmission.create({
        data: sharedSubmissionData,
      });

  const session = await prisma.quizSDRSession.upsert({
    where: {
      leadId_submissionId: {
        leadId: lead.id,
        submissionId: submission.id,
      },
    },
    update: {
      bookingUrl: args.bookingUrl,
      stageKey: "after_quiz",
      status: QuizSDRSessionStatus.READY,
      summary: normalized.profileSummary,
    },
    create: {
      bookingStatus: QuizBookingStatus.PENDING,
      bookingUrl: args.bookingUrl,
      leadId: lead.id,
      stageKey: "after_quiz",
      status: QuizSDRSessionStatus.READY,
      submissionId: submission.id,
      summary: normalized.profileSummary,
    },
  });

  const messageCount = await prisma.quizSDRMessage.count({
    where: {
      sessionId: session.id,
    },
  });

  if (messageCount === 0) {
    const hydratedSession = await getSDRSessionRecord(lead.leadToken);
    const openingMessage = hydratedSession
      ? await buildOpeningMessageForSession({
          bookingUrl: args.bookingUrl,
          session: hydratedSession,
        })
      : "Obrigado por concluir o diagnóstico. Vou te ajudar a aprofundar o contexto antes do agendamento.";

    await prisma.quizSDRMessage.create({
      data: {
        content: openingMessage,
        role: QuizSDRMessageRole.ASSISTANT,
        sessionId: session.id,
      },
    });
  }

  return {
    leadToken: lead.leadToken,
    sessionId: session.id,
    submissionId: submission.id,
  };
}

export async function getPublicSDRSession(leadToken: string) {
  const session = await getSDRSessionRecord(leadToken);
  return serializeSession(session);
}

export async function getSDRSessionState(leadToken: string) {
  const lead = await prisma.quizLead.findUnique({
    where: {
      leadToken,
    },
  });

  if (!lead) {
    return {
      session: null,
      state: "processing" as const,
    };
  }

  const session = await getPublicSDRSession(leadToken);
  if (!session) {
    return {
      session: null,
      state: "processing" as const,
    };
  }

  return {
    session,
    state: "ready" as const,
  };
}

export async function appendSDRMessage(args: {
  bookingUrl: string | null;
  leadToken: string;
  message: string;
}) {
  const normalizedMessage = args.message.trim();
  if (!normalizedMessage) {
    throw new Error("Mensagem vazia.");
  }

  const session = await getSDRSessionRecord(args.leadToken);
  if (!session) {
    throw new Error("Sessão SDR não encontrada.");
  }

  await prisma.quizSDRMessage.create({
    data: {
      content: normalizedMessage,
      role: QuizSDRMessageRole.USER,
      sessionId: session.id,
    },
  });

  const agentResult = await generateSDRReplyForSession({
    bookingUrl: args.bookingUrl,
    leadMessage: normalizedMessage,
    session,
  });

  const nextStatus = agentResult.readyToSchedule
    ? QuizSDRSessionStatus.READY_TO_SCHEDULE
    : QuizSDRSessionStatus.COLLECTING_INFO;
  const bookingStatus = agentResult.readyToSchedule
    ? QuizBookingStatus.READY
    : QuizBookingStatus.PENDING;

  await prisma.$transaction([
    prisma.quizSDRMessage.create({
      data: {
        content: agentResult.reply,
        role: QuizSDRMessageRole.ASSISTANT,
        sessionId: session.id,
      },
    }),
    prisma.quizSDRSession.update({
      where: {
        id: session.id,
      },
      data: {
        bookingStatus,
        bookingUrl: args.bookingUrl,
        lastUserMessageAt: new Date(),
        stageKey: agentResult.nextStageKey,
        status: nextStatus,
      },
    }),
  ]);

  const updatedSession = await getPublicSDRSession(args.leadToken);
  if (!updatedSession) {
    throw new Error("Não foi possível carregar a sessão SDR.");
  }

  return {
    redirectPath:
      agentResult.nextStageKey === "ready_to_schedule"
        ? `/agendamento?lead_token=${encodeURIComponent(args.leadToken)}`
        : null,
    session: updatedSession,
    shouldRedirectToBooking:
      agentResult.nextStageKey === "ready_to_schedule",
  };
}
