export type IerOption = {
  label: string;
  text: string;
  points: number;
};

export type IerDimension = {
  id: string;
  group: string;
  title: string;
  question: string;
  options: IerOption[];
};

export type IerResultBand = {
  range: string;
  title: string;
  description: string;
};

export const IER_CTA =
  'Descubra em 2 minutos se sua operação está construindo patrimônio ou apenas "moendo" dinheiro para manter o crescimento. Responda com sinceridade.';

export const IER_DIMENSIONS: IerDimension[] = [
  {
    id: "marca-atracao",
    group: "Grupo 1",
    title: "Marca & Atração",
    question: "Como o mercado reage à sua comunicação hoje?",
    options: [
      {
        label: "A",
        text: "O lead chega entendendo nosso valor e o comercial foca na solução.",
        points: 20,
      },
      {
        label: "B",
        text: "O lead chega atraído por promoções e o comercial negocia desconto.",
        points: 10,
      },
      {
        label: "C",
        text: 'O lead chega confuso ou desqualificado ("não era o que eu esperava").',
        points: 5,
      },
      {
        label: "D",
        text: "Não temos comunicação ativa e dependemos de indicações aleatórias.",
        points: 0,
      },
    ],
  },
  {
    id: "marketing-resposta",
    group: "Grupo 2",
    title: "Marketing & Resposta",
    question: "Quando um lead demonstra interesse, qual é o processo real?",
    options: [
      {
        label: "A",
        text: "Resposta em até 15 min com abordagem consultiva e registro no sistema.",
        points: 20,
      },
      {
        label: "B",
        text: 'O vendedor atende "quando sobra tempo", geralmente horas depois.',
        points: 10,
      },
      {
        label: "C",
        text: "O contato cai em canais gerais e muitas vezes se perde.",
        points: 0,
      },
    ],
  },
  {
    id: "marketing-vendas",
    group: "Grupo 3",
    title: "Conexão entre Marketing & Vendas",
    question:
      'Marketing e Vendas possuem um "contrato" claro sobre quem é o cliente ideal?',
    options: [
      {
        label: "A",
        text: "Sim, os critérios são claros e o feedback ajusta as campanhas.",
        points: 20,
      },
      {
        label: "B",
        text: "Temos uma ideia, mas há conflito frequente sobre qualidade dos leads.",
        points: 10,
      },
      {
        label: "C",
        text: "Não. O foco é gerar volume e ver no que vai dar.",
        points: 0,
      },
    ],
  },
  {
    id: "dados-tecnologia",
    group: "Grupo 4",
    title: "Base proprietária, Tecnologia & Dados",
    question: 'Onde vive a "verdade" sobre os números da sua empresa hoje?',
    options: [
      {
        label: "A",
        text: "Em um CRM unificado, com dashboards que a liderança acompanha.",
        points: 20,
      },
      {
        label: "B",
        text: "No CRM, mas os dados são alimentados de forma incompleta e confusa.",
        points: 10,
      },
      {
        label: "C",
        text: "Em planilhas paralelas, cadernos ou na cabeça do time.",
        points: 0,
      },
    ],
  },
  {
    id: "onboarding-retencao",
    group: "Grupo 5",
    title: "Onboarding & Retenção",
    question: 'O que acontece após a assinatura do contrato, no "Momento Zero"?',
    options: [
      {
        label: "A",
        text: "Existe um rito de passagem estruturado para garantir sucesso imediato.",
        points: 20,
      },
      {
        label: "B",
        text: "O cliente vai para o operacional, mas não há métrica clara de sucesso.",
        points: 5,
      },
      {
        label: "C",
        text: "O vendedor some e o cliente só recebe contato em cobrança ou renovação.",
        points: 0,
      },
    ],
  },
];

export const IER_RESULT_BANDS: IerResultBand[] = [
  {
    range: "85-100",
    title: "Operação Elite",
    description:
      "Sua máquina está azeitada. O desafio agora é escala e inovação para não estagnar.",
  },
  {
    range: "55-80",
    title: "Vazamento de Margem",
    description:
      "Você cresce, mas gasta muito mais do que deveria para atrair e manter clientes.",
  },
  {
    range: "30-50",
    title: "Risco Operacional",
    description:
      "Seus silos estão destruindo o lucro e o CAC está sufocando o caixa.",
  },
  {
    range: "0-25",
    title: "Caos de Receita",
    description:
      "A operação é reativa. Sem intervenção estrutural, a escala tende a ampliar o prejuízo.",
  },
];
