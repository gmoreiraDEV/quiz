import { IERProfile } from "../types/agent-state";

export function getReversalBase(profile: IERProfile) {
  switch (profile) {
    case "OPERACAO_ELITE":
      return `Exatamente por vocês já estarem bem é que o risco é o platô. Hoje seu Payback pode estar entre 12 e 15 meses. Com engenharia de receita, o objetivo é empurrar isso para menos de 9 meses, liberando mais meses de lucro por cliente.`;
    case "VAZAMENTO_DE_MARGEM":
      return `Vender mais com o processo atual pode só aumentar o desperdício. Se o Payback está longo e o cliente sai antes da maturação, cada novo contrato pode estar ampliando o prejuízo escondido.`;
    case "RISCO_OPERACIONAL":
      return `O ponto aqui não é orçamento de marketing, e sim tesouraria. Organizar a operação se paga com a recuperação de leads e oportunidades que você já pagou para gerar e hoje está perdendo no caminho.`;
    case "CAOS_DE_RECEITA":
      return `A falta de tempo é justamente o sintoma da ausência de processo. Sem intervenção estrutural, a operação continua te puxando para o operacional e o CAC tende a subir sem previsibilidade de lucro.`;
  }
}
