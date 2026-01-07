import { z } from 'zod';
import { ProjectSchema } from './entities';

export const ProjectMemberRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export type ProjectMemberRole = z.infer<typeof ProjectMemberRoleSchema>;

export const ProjectMemberSchema = z.object({
  uid: z.string(),
  role: ProjectMemberRoleSchema,
  addedAt: z.number(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

// ProjectSchema and Project are now imported from ./entities to avoid duplicate exports in index.ts
// Re-exporting them here is not necessary as index.ts exports * from entities

export const CreateProjectSchema = ProjectSchema.pick({
  name: true,
  description: true,
}).extend({
    paperIds: z.array(z.string()).optional(),
    conceptIds: z.array(z.string()).optional(),
    status: z.string().optional(),
    milestones: z.array(z.string()).optional(),
    collaborators: z.array(z.string()).optional(),
});
export type CreateProjectDTO = z.infer<typeof CreateProjectSchema>;
