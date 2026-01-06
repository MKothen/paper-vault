import { z } from 'zod';

export const ProjectSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional().default(''),
    ownerId: z.string(),
    createdAt: z.number().int().default(() => Date.now()),
    modifiedAt: z.number().int().optional(),
    archived: z.boolean().optional().default(false),
  })
  .passthrough();

export type ProjectModel = z.infer<typeof ProjectSchema>;
