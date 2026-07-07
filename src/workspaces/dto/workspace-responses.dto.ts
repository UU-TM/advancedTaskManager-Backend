import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WorkspaceMemberSchema = z
  .object({
    workspaceId: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(['ADMIN', 'MEMBER']),
    createdAt: z.string().datetime(),
  })
  .meta({ id: 'WorkspaceMember' });

export class WorkspaceMemberDto extends createZodDto(WorkspaceMemberSchema) {}

export const WorkspaceSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    ownerId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: 'Workspace' });

export class WorkspaceDto extends createZodDto(WorkspaceSchema) {}
