import { z } from "zod";

export const objectionSchema = z.object({
  objection: z.enum([
    "NAO_PRECISO",
    "QUERO_VENDER_MAIS_PRIMEIRO",
    "SEM_ORCAMENTO",
    "SEM_TEMPO",
    "HESITANDO",
    "SEM_OBJECAO",
    "DESCONHECIDA",
  ]),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});
