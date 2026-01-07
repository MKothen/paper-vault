import { z } from 'zod';

export const ProjectMemberRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export type ProjectMemberRole = z.infer<typeof ProjectMemberRoleSchema>;

export const ProjectMemberSchema = z.object({
  uid: z.string(),
  role: ProjectMemberRoleSchema,
  addedAt: z.number(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  ownerId: z.string(),
  members: z.record(ProjectMemberSchema), // uid -> Member
  paperIds: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
  archived: z.boolean().default(false),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = ProjectSchema.pick({
  name: true,
  description: true,
}).extend({
    paperIds: z.array(z.string()).optional()
});
export type CreateProjectDTO = z.infer<typeof CreateProjectSchema>;
