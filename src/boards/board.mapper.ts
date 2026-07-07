import {
  Board,
  BoardMember,
  Column,
} from '../generated/prisma-client/client';
import { z } from 'zod';
import {
  BoardMemberSchema,
  BoardSchema,
  ColumnSchema,
} from './dto/board-responses.dto';

export type BoardResponse = z.infer<typeof BoardSchema>;
export type BoardMemberResponse = z.infer<typeof BoardMemberSchema>;
export type ColumnResponse = z.infer<typeof ColumnSchema>;

export function toBoardResponse(board: Board): BoardResponse {
  return {
    id: board.id,
    workspaceId: board.workspaceId,
    name: board.name,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

export function toBoardMemberResponse(member: BoardMember): BoardMemberResponse {
  return {
    boardId: member.boardId,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
  };
}

export function toColumnResponse(column: Column): ColumnResponse {
  return {
    id: column.id,
    boardId: column.boardId,
    title: column.title,
    position: column.position,
  };
}
