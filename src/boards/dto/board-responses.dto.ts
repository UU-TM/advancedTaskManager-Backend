import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BoardMemberSchema = z
  .object({
    boardId: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(['VIEWER', 'EDITOR']),
    createdAt: z.string().datetime(),
  })
  .meta({ id: 'BoardMember' });

export class BoardMemberDto extends createZodDto(BoardMemberSchema) {}

export const BoardSchema = z
  .object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: 'Board' });

export class BoardDto extends createZodDto(BoardSchema) {}

export const ColumnSchema = z
  .object({
    id: z.string().uuid(),
    boardId: z.string().uuid(),
    title: z.string(),
    position: z.number(),
  })
  .meta({ id: 'Column' });

export class ColumnDto extends createZodDto(ColumnSchema) {}
