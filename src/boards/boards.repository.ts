import { Injectable } from '@nestjs/common';
import {
  Board,
  BoardMember,
  BoardRole,
  Column,
} from '../generated/prisma-client/client';
import { nextAppendPosition } from '../common/position/position.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { workspaceId: string; name: string }): Promise<Board> {
    return this.prisma.board.create({ data });
  }

  findById(id: string): Promise<Board | null> {
    return this.prisma.board.findUnique({ where: { id } });
  }

  findColumnById(id: string): Promise<Column | null> {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async createColumn(data: {
    boardId: string;
    title: string;
  }): Promise<Column> {
    const lastColumn = await this.prisma.column.findFirst({
      where: { boardId: data.boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.column.create({
      data: {
        boardId: data.boardId,
        title: data.title,
        position: nextAppendPosition(lastColumn?.position ?? null),
      },
    });
  }

  upsertMember(data: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }): Promise<BoardMember> {
    return this.prisma.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId: data.boardId,
          userId: data.userId,
        },
      },
      create: data,
      update: { role: data.role },
    });
  }
}
