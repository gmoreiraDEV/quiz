export type IERProfile =
  | "OPERACAO_ELITE"
  | "VAZAMENTO_DE_MARGEM"
  | "RISCO_OPERACIONAL"
  | "CAOS_DE_RECEITA";

export type MainPain =
  | "MARCA_ATRACAO"
  | "MARKETING_RESPOSTA"
  | "MKT_VENDAS_SLA"
  | "TECNOLOGIA_DADOS"
  | "ONBOARDING_RETENCAO";

export type LeadObjection =
  | "NAO_PRECISO"
  | "QUERO_VENDER_MAIS_PRIMEIRO"
  | "SEM_ORCAMENTO"
  | "SEM_TEMPO"
  | "HESITANDO"
  | "SEM_OBJECAO"
  | "DESCONHECIDA";

export type ConversationStage =
  | "ABERTURA"
  | "EXPLORACAO"
  | "REVERSAO"
  | "FECHAMENTO"
  | "PRE_QUALIFICACAO"
  | "ENCERRADO";

export interface QuizAnswer {
  group: "marca" | "marketing" | "sla" | "dados" | "retencao";
  option: "A" | "B" | "C" | "D";
  points: number;
}

export interface LeadContext {
  name: string;
  score: number;
  answers: QuizAnswer[];
  profile?: IERProfile;
  profileSummary?: string;
  weakestPillarName?: string;
  mainPain?: MainPain;
  stage?: ConversationStage;
  objection?: LeadObjection;
  objectionConfidence?: number;
  leadMessage?: string;
  generatedReply?: string;
  ticketMedio?: string;
  cicloVenda?: string;
  meetingOption1?: string;
  meetingOption2?: string;
  bookingUrl?: string;
  readyToSchedule?: boolean;
  sessionStageKey?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}
