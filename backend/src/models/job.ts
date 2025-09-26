import { z } from "zod";

const RequirementItemSchema = z.union([
  z.string().min(1),
  z.object({
    language: z.string().min(1),
    level: z.string().min(1),
  }),
]);

const RequirementGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(RequirementItemSchema).min(1),
});

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
export type RequirementItem = z.infer<typeof RequirementItemSchema>;

export function extractRequirementStrings(requirement?: RequirementItem): string | null {
  if (!requirement) {
    return null;
  }

  if (typeof requirement === "string") {
    return requirement;
  }

  return `${requirement.language} (${requirement.level})`;
}

export function extractJobKeywords(job: Job): Array<string> {
  const baseKeywords = new Set<string>();

  if (Array.isArray(job.keywords)) {
    job.keywords.forEach((keyword) => baseKeywords.add(keyword.toLowerCase()));
  }

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
}
