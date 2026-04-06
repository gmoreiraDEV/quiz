export type IerOption = {
  label: string;
  text: string;
  points: number;
};

export type IerDimension = {
  group: string;
  id: string;
  question: string;
  title: string;
  typebotBlockId: string;
  typebotVariableName: string;
  options: IerOption[];
};

export type IerResultBand = {
  code: string;
  description: string;
  range: string;
  recommendation: string;
  title: string;
};

export type IerNormalizedAnswer = {
  group: string;
  option: string;
  points: number;
  question: string;
  text: string;
  title: string;
};

export type IerComputedSubmission = {
  answers: IerNormalizedAnswer[];
  maxScore: number;
  percentage: number;
  profileCode: string;
  profileName: string;
  profileSummary: string;
  recommendation: string;
  strongestPillarName: string | null;
  totalScore: number;
  weakestPillarName: string | null;
};

export const IER_CTA =
  'Descubra em 2 minutos se sua operação está construindo patrimônio ou apenas "moendo" dinheiro para manter o crescimento. Responda com sinceridade.';

export const IER_MAX_SCORE = 100;

export const IER_DIMENSIONS: IerDimension[] = [
  {
    id: "marca-atracao",
    group: "marca",
    title: "Marca & Atração",
    question: "Como o mercado reage à sua comunicação hoje?",
    typebotBlockId: "b30aln99tgbsyy9h77m9gelib",
    typebotVariableName: "g1",
    options: [
      {
        label: "A",
        text: "O lead chega entendendo nosso valor e o comercial foca na solução.",
        points: 20,
      },
      {
        label: "B",
        text: "O lead chega atraído por promoções e o comercial gasta 80% do tempo negociando desconto.",
        points: 10,
      },
      {
        label: "C",
        text: 'O lead chega confuso ou desqualificado ("não era o que eu esperava").',
        points: 5,
      },
      {
        label: "D",
        text: "Não temos uma comunicação ativa; dependemos 100% de indicações orgânicas / aleatórias.",
        points: 0,
      },
    ],
  },
  {
    id: "marketing-resposta",
    group: "marketing",
    title: "Marketing & Resposta",
    question: "Quando um lead demonstra interesse, qual é o processo real?",
    typebotBlockId: "bp7yu8osxroscp5ozrvcyg1xy",
    typebotVariableName: "g2",
    options: [
      {
        label: "A",
        text: "Resposta em até 15 min com abordagem consultiva e registro automático no sistema / CRM.",
        points: 20,
      },
      {
        label: "B",
        text: 'O vendedor recebe o contato e atende "quando sobra tempo" (geralmente horas depois).',
        points: 10,
      },
      {
        label: "C",
        text: "O contato cai em um e-mail ou WhatsApp geral e muitas vezes se perde.",
        points: 0,
      },
    ],
  },
  {
    id: "marketing-vendas",
    group: "sla",
    title: "Conexão entre Marketing & Vendas",
    question:
      'Marketing e Vendas possuem um "contrato" (SLA) definido sobre o que é um cliente ideal?',
    typebotBlockId: "bl0rct0jxwhrbywifnqcxjzol",
    typebotVariableName: "g3",
    options: [
      {
        label: "A",
        text: "Sim, os critérios são claros e o feedback de vendas ajusta as campanhas de marketing.",
        points: 20,
      },
      {
        label: "B",
        text: "Temos uma ideia de quem é o cliente, mas há conflitos constantes sobre a qualidade dos leads.",
        points: 10,
      },
      {
        label: "C",
        text: "Não, o foco é gerar volume e ver no que vai dar.",
        points: 0,
      },
    ],
  },
  {
    id: "dados-tecnologia",
    group: "dados",
    title: "Base proprietária, Tecnologia & Dados",
    question: 'Onde vive a "verdade" sobre os números da sua empresa hoje?',
    typebotBlockId: "brtq577flgvvh4cgb68h6f8o7",
    typebotVariableName: "g4",
    options: [
      {
        label: "A",
        text: "Em um CRM unificado, com dashboards que eu (CEO) acompanho pelo celular.",
        points: 20,
      },
      {
        label: "B",
        text: "No CRM, mas os dados são alimentados de forma incompleta e confusa.",
        points: 10,
      },
      {
        label: "C",
        text: "Em planilhas paralelas, cadernos ou apenas na cabeça dos vendedores.",
        points: 0,
      },
    ],
  },
  {
    id: "onboarding-retencao",
    group: "retencao",
    title: "Onboarding & Retenção",
    question: 'O que acontece após a assinatura do contrato (o "Momento Zero")?',
    typebotBlockId: "b4v5ihlim9qjhhmqk5q4qu0ki",
    typebotVariableName: "g5",
    options: [
      {
        label: "A",
        text: "Existe um rito de passagem estruturado para garantir que o cliente tenha sucesso imediato.",
        points: 20,
      },
      {
        label: "B",
        text: "O cliente é entregue ao operacional, mas não temos métricas de satisfação ou sucesso.",
        points: 5,
      },
      {
        label: "C",
        text: "O vendedor some e o cliente só recebe contato novamente na hora de pagar ou renovar.",
        points: 0,
      },
    ],
  },
];

export const IER_RESULT_BANDS: IerResultBand[] = [
  {
    code: "operacao_elite",
    range: "85-100",
    title: "Operação Elite",
    description: "Sua máquina está azeitada.",
    recommendation:
      "O desafio agora é escala e inovação para não estagnar.",
  },
  {
    code: "vazamento_de_margem",
    range: "55-80",
    title: "Vazamento de Margem",
    description:
      "Você cresce, mas gasta muito mais do que deveria para atrair e manter clientes.",
    recommendation:
      "Você já tem base para crescer, mas precisa reduzir desperdícios e alinhar a operação.",
  },
  {
    code: "risco_operacional",
    range: "30-50",
    title: "Risco Operacional",
    description:
      "Seus silos estão destruindo o lucro. O custo de aquisição (CAC) está sufocando o caixa.",
    recommendation:
      "É hora de corrigir processo, integração e acompanhamento para parar de perder margem.",
  },
  {
    code: "caos_de_receita",
    range: "0-25",
    title: "Caos de Receita",
    description:
      "A operação é reativa. Sem intervenção estrutural, a escala será o seu maior prejuízo.",
    recommendation:
      "Você precisa de intervenção estrutural urgente em marketing, vendas, dados e retenção.",
  },
];

export const IER_TYPEBOT_CONTACT_BLOCK_IDS = {
  respondentName: "bm2l3q6v9k1t5c8r4p7n0x2hz",
  email: "bt4x7m1q8r3n6c2v9k5p0z4ly",
  phoneNumber: "bf8p2v6m1q4z7k3c9r5t0n8ya",
} as const;

const IER_DIMENSION_BY_BLOCK_ID = new Map(
  IER_DIMENSIONS.map((dimension) => [dimension.typebotBlockId, dimension]),
);

function normalizeChoiceText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function resolveIerBand(totalScore: number): IerResultBand {
  if (totalScore >= 85) {
    return IER_RESULT_BANDS[0];
  }

  if (totalScore >= 55) {
    return IER_RESULT_BANDS[1];
  }

  if (totalScore >= 30) {
    return IER_RESULT_BANDS[2];
  }

  return IER_RESULT_BANDS[3];
}

export function getIerContactFieldFromBlockId(blockId: string) {
  if (blockId === IER_TYPEBOT_CONTACT_BLOCK_IDS.respondentName) {
    return "respondent_name";
  }

  if (blockId === IER_TYPEBOT_CONTACT_BLOCK_IDS.email) {
    return "email";
  }

  if (blockId === IER_TYPEBOT_CONTACT_BLOCK_IDS.phoneNumber) {
    return "phone_number";
  }

  return null;
}

export function getIerAnswerFromTypebot(blockId: string, message: string) {
  const dimension = IER_DIMENSION_BY_BLOCK_ID.get(blockId);
  if (!dimension) {
    return null;
  }

  const normalizedMessage = normalizeChoiceText(message);
  const option = dimension.options.find((entry) => {
    const withLabel = `${entry.label}) ${entry.text}`;
    return (
      normalizeChoiceText(withLabel) === normalizedMessage ||
      normalizeChoiceText(entry.text) === normalizedMessage
    );
  });

  if (!option) {
    return null;
  }

  return {
    group: dimension.group,
    option: option.label,
    points: option.points,
    question: dimension.question,
    text: option.text,
    title: dimension.title,
  } satisfies IerNormalizedAnswer;
}

export function computeIerSubmission(
  answers: IerNormalizedAnswer[],
): IerComputedSubmission {
  const totalScore = answers.reduce((sum, answer) => sum + answer.points, 0);
  const percentage = Math.round((totalScore / IER_MAX_SCORE) * 100);
  const band = resolveIerBand(totalScore);

  const strongestAnswer = answers.reduce<IerNormalizedAnswer | null>(
    (current, answer) =>
      !current || answer.points > current.points ? answer : current,
    null,
  );

  const weakestAnswer = answers.reduce<IerNormalizedAnswer | null>(
    (current, answer) =>
      !current || answer.points < current.points ? answer : current,
    null,
  );

  return {
    answers,
    maxScore: IER_MAX_SCORE,
    percentage,
    profileCode: band.code,
    profileName: band.title,
    profileSummary: `${band.description} ${band.recommendation}`,
    recommendation: band.recommendation,
    strongestPillarName: strongestAnswer?.title ?? null,
    totalScore,
    weakestPillarName: weakestAnswer?.title ?? null,
  };
}
