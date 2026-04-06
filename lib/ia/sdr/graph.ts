import { ChatOpenAI } from "@langchain/openai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { serverEnv } from "@/lib/env";

import { objectionClassifierPrompt } from "./prompts/objection-classifier-prompt";
import { SDR_SYSTEM_PROMPT } from "./prompts/sdr-system-prompt";
import { objectionSchema } from "./schemas/sdr-output";
import { getReversalBase } from "./tools/get-reversal-base";
import type {
  ConversationStage,
  IERProfile,
  LeadContext,
  LeadObjection,
  MainPain,
} from "./types/agent-state";

const SDRState = Annotation.Root({
  answers: Annotation<LeadContext["answers"]>({
    default: () => [],
    reducer: (_current, next) => next,
  }),
  bookingUrl: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  cicloVenda: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  generatedReply: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  history: Annotation<LeadContext["history"]>({
    default: () => [],
    reducer: (_current, next) => next,
  }),
  leadMessage: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  mainPain: Annotation<MainPain | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  meetingOption1: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  meetingOption2: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  name: Annotation<string>({
    default: () => "",
    reducer: (_current, next) => next,
  }),
  objection: Annotation<LeadObjection | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  objectionConfidence: Annotation<number | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  profile: Annotation<IERProfile | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  profileSummary: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  readyToSchedule: Annotation<boolean | undefined>({
    default: () => false,
    reducer: (_current, next) => next,
  }),
  score: Annotation<number>({
    default: () => 0,
    reducer: (_current, next) => next,
  }),
  sessionStageKey: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  stage: Annotation<ConversationStage | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  ticketMedio: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
  weakestPillarName: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_current, next) => next,
  }),
});

type SDRStateType = typeof SDRState.State;

type SDRAgentResult = {
  nextStageKey: "after_quiz" | "ready_to_schedule" | "reversal_pending";
  objection: LeadObjection;
  objectionConfidence?: number;
  readyToSchedule: boolean;
  reply: string;
  stage: ConversationStage;
};

let sharedModel: ChatOpenAI | null | undefined;
let sharedStructuredClassifier:
  | ReturnType<ChatOpenAI["withStructuredOutput"]>
  | null
  | undefined;

function getModel() {
  if (sharedModel !== undefined) {
    return sharedModel;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    sharedModel = null;
    return sharedModel;
  }

  sharedModel = new ChatOpenAI({
    model: serverEnv.openAiModel,
    temperature: 0.35,
  });
  return sharedModel;
}

function getStructuredClassifier() {
  if (sharedStructuredClassifier !== undefined) {
    return sharedStructuredClassifier;
  }

  const model = getModel();
  if (!model) {
    sharedStructuredClassifier = null;
    return sharedStructuredClassifier;
  }

  sharedStructuredClassifier = model.withStructuredOutput(objectionSchema, {
    name: "LeadObjectionClassification",
    strict: true,
  });
  return sharedStructuredClassifier;
}

function inferProfile(score: number): IERProfile {
  if (score >= 85) {
    return "OPERACAO_ELITE";
  }

  if (score >= 55) {
    return "VAZAMENTO_DE_MARGEM";
  }

  if (score >= 30) {
    return "RISCO_OPERACIONAL";
  }

  return "CAOS_DE_RECEITA";
}

function inferMainPain(input: {
  answers: LeadContext["answers"];
  weakestPillarName?: string;
}): MainPain {
  const weakest = input.weakestPillarName?.trim().toLowerCase() ?? "";

  if (weakest.includes("marca") || weakest.includes("atra")) {
    return "MARCA_ATRACAO";
  }

  if (
    weakest.includes("resposta") ||
    weakest.includes("marketing & resposta")
  ) {
    return "MARKETING_RESPOSTA";
  }

  if (
    weakest.includes("conex") ||
    weakest.includes("vendas") ||
    weakest.includes("sla")
  ) {
    return "MKT_VENDAS_SLA";
  }

  if (
    weakest.includes("dados") ||
    weakest.includes("tecnologia") ||
    weakest.includes("crm")
  ) {
    return "TECNOLOGIA_DADOS";
  }

  if (
    weakest.includes("reten") ||
    weakest.includes("onboarding") ||
    weakest.includes("momento zero")
  ) {
    return "ONBOARDING_RETENCAO";
  }

  const lowestAnswer = [...input.answers].sort((left, right) => left.points - right.points)[0];
  switch (lowestAnswer?.group) {
    case "marca":
      return "MARCA_ATRACAO";
    case "marketing":
      return "MARKETING_RESPOSTA";
    case "sla":
      return "MKT_VENDAS_SLA";
    case "dados":
      return "TECNOLOGIA_DADOS";
    case "retencao":
      return "ONBOARDING_RETENCAO";
    default:
      return "MARKETING_RESPOSTA";
  }
}

function painLabel(mainPain: MainPain) {
  switch (mainPain) {
    case "MARCA_ATRACAO":
      return "marca e atração";
    case "MARKETING_RESPOSTA":
      return "tempo de resposta e aproveitamento dos leads";
    case "MKT_VENDAS_SLA":
      return "conexão entre marketing e vendas";
    case "TECNOLOGIA_DADOS":
      return "dados, CRM e previsibilidade";
    case "ONBOARDING_RETENCAO":
      return "onboarding e retenção";
  }
}

function extractText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          return [item];
        }

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return [item.text];
        }

        return [];
      })
      .join("\n")
      .trim();
  }

  return "";
}

function classifyObjectionHeuristically(message: string) {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("não preciso") ||
    normalized.includes("nao preciso") ||
    normalized.includes("já faço") ||
    normalized.includes("ja faço") ||
    normalized.includes("já resolvido") ||
    normalized.includes("ja resolvido")
  ) {
    return { confidence: 0.77, objection: "NAO_PRECISO" as const };
  }

  if (
    normalized.includes("vender mais") ||
    normalized.includes("gerar mais lead") ||
    normalized.includes("mais demanda")
  ) {
    return {
      confidence: 0.79,
      objection: "QUERO_VENDER_MAIS_PRIMEIRO" as const,
    };
  }

  if (
    normalized.includes("orçamento") ||
    normalized.includes("orcamento") ||
    normalized.includes("caro") ||
    normalized.includes("sem verba")
  ) {
    return { confidence: 0.82, objection: "SEM_ORCAMENTO" as const };
  }

  if (
    normalized.includes("sem tempo") ||
    normalized.includes("correria") ||
    normalized.includes("agora não") ||
    normalized.includes("agora nao")
  ) {
    return { confidence: 0.8, objection: "SEM_TEMPO" as const };
  }

  if (
    normalized.includes("talvez") ||
    normalized.includes("depois") ||
    normalized.includes("me manda") ||
    normalized.includes("preciso pensar")
  ) {
    return { confidence: 0.67, objection: "HESITANDO" as const };
  }

  return {
    confidence: normalized.length >= 24 ? 0.61 : 0.42,
    objection: normalized.length >= 24 ? ("SEM_OBJECAO" as const) : ("DESCONHECIDA" as const),
  };
}

async function classifyObjection(message: string) {
  const classifier = getStructuredClassifier();
  if (!classifier) {
    return classifyObjectionHeuristically(message);
  }

  try {
    const result = await classifier.invoke(
      `${objectionClassifierPrompt}\n\nMensagem do lead:\n${message}`,
    );
    const parsed =
      result &&
      typeof result === "object" &&
      "parsed" in result &&
      result.parsed &&
      typeof result.parsed === "object"
        ? result.parsed
        : result;

    return objectionSchema.parse(parsed);
  } catch (error) {
    console.error("quiz.sdr.classify_objection", error);
    return classifyObjectionHeuristically(message);
  }
}

async function generateModelReply(prompt: string) {
  const model = getModel();
  if (!model) {
    return null;
  }

  try {
    const response = await model.invoke(prompt);
    const text = extractText(response.content);
    return text || null;
  } catch (error) {
    console.error("quiz.sdr.generate_reply", error);
    return null;
  }
}

function buildOpeningFallback(state: SDRStateType) {
  return `Olá, ${state.name}! Aqui é o estrategista da Lureness. Seu IER ficou em ${state.score} pontos e o principal vazamento que aparece no diagnóstico está em ${painLabel(state.mainPain ?? "MARKETING_RESPOSTA")}. Antes de te levar para o agendamento, quero entender uma coisa: onde isso mais pesa hoje na sua operação?`;
}

async function buildOpeningReply(state: SDRStateType) {
  const fallback = buildOpeningFallback(state);
  const reply = await generateModelReply(
    `${SDR_SYSTEM_PROMPT}

Contexto do lead:
- Nome: ${state.name}
- Score IER: ${state.score}
- Perfil: ${state.profile ?? "DESCONHECIDO"}
- Dor principal: ${painLabel(state.mainPain ?? "MARKETING_RESPOSTA")}
- Resumo do diagnóstico: ${state.profileSummary ?? "Sem resumo adicional."}

Escreva a primeira mensagem do SDR após o quiz.
Objetivo:
- reconhecer o diagnóstico,
- conectar a dor ao impacto econômico,
- fazer uma pergunta curta para o lead abrir contexto,
- não oferecer agenda ainda.

Retorne apenas a mensagem final em português.`,
  );

  return reply || fallback;
}

async function buildReversalReply(state: SDRStateType) {
  const base = getReversalBase(state.profile ?? "CAOS_DE_RECEITA");
  const fallback = `${base} Dito isso, qual é o impacto mais claro disso hoje: caixa, previsibilidade do funil, produtividade do time ou perda de clientes?`;
  const reply = await generateModelReply(
    `${SDR_SYSTEM_PROMPT}

Contexto do lead:
- Nome: ${state.name}
- Score IER: ${state.score}
- Perfil: ${state.profile ?? "DESCONHECIDO"}
- Dor principal: ${painLabel(state.mainPain ?? "MARKETING_RESPOSTA")}
- Objeção: ${state.objection ?? "DESCONHECIDA"}
- Última mensagem do lead: ${state.leadMessage ?? "Sem mensagem"}
- Resumo do diagnóstico: ${state.profileSummary ?? "Sem resumo adicional."}

Base de reversão:
${base}

Escreva uma resposta curta, consultiva e comercial.
Ela deve:
- responder a objeção do lead,
- conectar a dor a impacto econômico,
- terminar com uma pergunta curta para aprofundar.

Retorne apenas a mensagem final em português.`,
  );

  return reply || fallback;
}

async function buildClosingReply(state: SDRStateType) {
  const fallback = state.bookingUrl
    ? `Ficou claro que o gargalo em ${painLabel(state.mainPain ?? "MARKETING_RESPOSTA")} está travando margem e previsibilidade. Faz sentido avançarmos. Vou te levar agora para o agendamento da conversa estratégica.`
    : `Ficou claro que o gargalo em ${painLabel(state.mainPain ?? "MARKETING_RESPOSTA")} está travando margem e previsibilidade. Faz sentido avançarmos para a próxima etapa assim que a agenda estiver disponível.`;
  const reply = await generateModelReply(
    `${SDR_SYSTEM_PROMPT}

Contexto do lead:
- Nome: ${state.name}
- Score IER: ${state.score}
- Perfil: ${state.profile ?? "DESCONHECIDO"}
- Dor principal: ${painLabel(state.mainPain ?? "MARKETING_RESPOSTA")}
- Última mensagem do lead: ${state.leadMessage ?? "Sem mensagem"}
- Histórico recente:
${state.history.map((item) => `${item.role}: ${item.content}`).join("\n") || "Sem histórico"}

Escreva a mensagem final do SDR antes do agendamento.
Ela deve:
- sintetizar a dor e o impacto,
- confirmar que faz sentido avançar,
- direcionar o lead para a agenda,
- ser curta e direta.

Retorne apenas a mensagem final em português.`,
  );

  return reply || fallback;
}

function normalizeState(input: LeadContext): SDRStateType {
  const profile = input.profile ?? inferProfile(input.score);
  const mainPain = input.mainPain ?? inferMainPain({
    answers: input.answers,
    weakestPillarName: input.weakestPillarName,
  });

  return {
    answers: input.answers,
    bookingUrl: input.bookingUrl,
    cicloVenda: input.cicloVenda,
    generatedReply: input.generatedReply,
    history: input.history,
    leadMessage: input.leadMessage,
    mainPain,
    meetingOption1: input.meetingOption1,
    meetingOption2: input.meetingOption2,
    name: input.name,
    objection: input.objection ?? "DESCONHECIDA",
    objectionConfidence: input.objectionConfidence,
    profile,
    profileSummary: input.profileSummary,
    readyToSchedule: input.readyToSchedule ?? false,
    score: input.score,
    sessionStageKey: input.sessionStageKey,
    stage: input.stage ?? "ABERTURA",
    ticketMedio: input.ticketMedio,
    weakestPillarName: input.weakestPillarName,
  };
}

const workflow = new StateGraph(SDRState)
  .addNode("hydrateLeadFromQuiz", async (state) => ({
    mainPain:
      state.mainPain ??
      inferMainPain({
        answers: state.answers,
        weakestPillarName: state.weakestPillarName,
      }),
    profile: state.profile ?? inferProfile(state.score),
    stage:
      state.sessionStageKey === "reversal_pending" ? "REVERSAO" : "ABERTURA",
  }))
  .addNode("generateOpeningMessage", async (state) => ({
    generatedReply: await buildOpeningReply(state),
    readyToSchedule: false,
    stage: "ABERTURA",
  }))
  .addNode("classifyObjection", async (state) => {
    const objection = await classifyObjection(state.leadMessage ?? "");
    return {
      objection: objection.objection,
      objectionConfidence: objection.confidence,
      stage:
        objection.objection === "SEM_OBJECAO" ? ("FECHAMENTO" as const) : ("REVERSAO" as const),
    };
  })
  .addNode("generateReversal", async (state) => ({
    generatedReply: await buildReversalReply(state),
    readyToSchedule: false,
    stage: "REVERSAO",
  }))
  .addNode("generateClosing", async (state) => ({
    generatedReply: await buildClosingReply(state),
    readyToSchedule: true,
    stage: "FECHAMENTO",
  }));

workflow.addEdge(START, "hydrateLeadFromQuiz");
workflow.addConditionalEdges("hydrateLeadFromQuiz", (state) => {
  if (!state.leadMessage?.trim()) {
    return "generateOpeningMessage";
  }

  if (state.sessionStageKey === "reversal_pending") {
    return "generateClosing";
  }

  return "classifyObjection";
});
workflow.addConditionalEdges("classifyObjection", (state) => {
  return state.objection === "SEM_OBJECAO"
    ? "generateClosing"
    : "generateReversal";
});
workflow.addEdge("generateOpeningMessage", END);
workflow.addEdge("generateReversal", END);
workflow.addEdge("generateClosing", END);

const compiledWorkflow = workflow.compile();

export async function runSDRAgent(input: LeadContext) {
  return compiledWorkflow.invoke(normalizeState(input));
}

export async function createOpeningSDRMessage(input: LeadContext) {
  const state = await runSDRAgent({
    ...input,
    leadMessage: undefined,
    sessionStageKey: input.sessionStageKey ?? "after_quiz",
  });

  return (
    state.generatedReply ||
    buildOpeningFallback(normalizeState({ ...input, leadMessage: undefined }))
  );
}

export async function advanceSDRAgent(input: LeadContext): Promise<SDRAgentResult> {
  const state = await runSDRAgent(input);
  const readyToSchedule = Boolean(state.readyToSchedule);
  const reply =
    state.generatedReply ||
    (readyToSchedule
      ? await buildClosingReply(state)
      : await buildReversalReply(state));

  return {
    nextStageKey: readyToSchedule ? "ready_to_schedule" : "reversal_pending",
    objection: state.objection ?? "DESCONHECIDA",
    objectionConfidence: state.objectionConfidence,
    readyToSchedule,
    reply,
    stage: state.stage ?? (readyToSchedule ? "FECHAMENTO" : "REVERSAO"),
  };
}
