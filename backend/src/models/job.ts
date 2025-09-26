import { z } from "zod";

/**
 * Esquema Zod para validar e tipar um item de requisito (RequirementItem).
 * Pode ser uma string simples ou um objeto com linguagem e nível.
 */
const RequirementItemSchema = z.union([
  z.string().min(1),
  z.object({
    language: z.string().min(1),
    level: z.string().min(1),
  }),
]);

/**
 * Esquema Zod para validar e tipar um grupo de requisitos (RequirementGroup).
 * Inclui uma categoria e uma lista de itens de requisitos.
 */
const RequirementGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(RequirementItemSchema).min(1),
});

/**
 * Esquema Zod principal para validar e tipar a estrutura completa de uma vaga (Job).
 * Inclui campos opcionais e obrigatórios, bem como a capacidade de aceitar propriedades adicionais.
 */
export const JobSchema = z
  .object({
    description: z.string().optional(),
    id: z.string().min(1),
    keywords: z.array(z.string()).optional(),
    requirements: z
      .object({
        desirable: z.array(RequirementGroupSchema).optional(),
        mandatory: z.array(RequirementGroupSchema).optional(),
      })
      .optional(),
    responsibilities: z.array(z.string()).optional(),
    title: z.string().min(1),
  })
  .passthrough();

export type Job = z.infer<typeof JobSchema>;
type RequirementItem = z.infer<typeof RequirementItemSchema>;

/** Extrai uma representação em string de um item de requisito.
 * @param requirement - O item de requisito, que pode ser uma string ou um objeto com linguagem e nível.
 * @returns A representação em string do requisito ou null se o requisito for indefinido.
 */
export const extractRequirementStrings = (requirement?: RequirementItem): string | null => {
  if (!requirement) {
    return null;
  }

  if (typeof requirement === "string") {
    return requirement;
  }

  return `${requirement.language} (${requirement.level})`;
};

/** Extrai um conjunto de palavras-chave relevantes de uma descrição de vaga.
 * As palavras-chave são extraídas de vários campos da vaga, incluindo:
 * - A lista explícita de palavras-chave (keywords).
 * - Itens de requisitos obrigatórios e desejáveis.
 * - Responsabilidades listadas.
 * - Palavras na descrição da vaga (tokens com mais de 2 caracteres).
 * Todas as palavras-chave são convertidas para minúsculas e armazenadas em um conjunto para evitar duplicatas.
 * @param job - O objeto Job do qual extrair as palavras-chave.
 * @returns Um array de palavras-chave únicas extraídas da vaga.
 */
export const extractJobKeywords = (job: Job): Array<string> => {
  const baseKeywords = new Set<string>();

  if (Array.isArray(job.keywords)) {
    job.keywords.forEach((keyword) => baseKeywords.add(keyword.toLowerCase()));
  }

  /** Adiciona palavras-chave extraídas de grupos de requisitos ao conjunto base.
   * @param groups - Uma lista opcional de grupos de requisitos.
   */
  const addFromRequirements = (groups?: Array<{ category: string; items: Array<RequirementItem> }>) => {
    groups?.forEach((group) => {
      group.items.forEach((item) => {
        const asString = extractRequirementStrings(item);
        if (asString) {
          baseKeywords.add(asString.toLowerCase());
        }
      });
    });
  };

  addFromRequirements(job.requirements?.mandatory);
  addFromRequirements(job.requirements?.desirable);

  job.responsibilities?.forEach((responsibility) => {
    baseKeywords.add(responsibility.toLowerCase());
  });

  if (job.description) {
    job.description
      .split(/[^a-zA-Z0-9+]+/)
      .filter((token) => token.length > 2)
      .forEach((token) => baseKeywords.add(token.toLowerCase()));
  }

  return Array.from(baseKeywords);
};
