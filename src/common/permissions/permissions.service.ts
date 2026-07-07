import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BoardRole,
  WorkspaceRole,
} from '../../generated/prisma-client/client';
import { PrismaService } from '../../prisma/prisma.service';

const WORKSPACE_ROLE_RANK: Record<WorkspaceRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
};

const BOARD_ROLE_RANK: Record<BoardRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
};

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async hasWorkspaceAccess(
    workspaceId: string,
    userId: string,
    minimumRole: WorkspaceRole,
  ): Promise<boolean> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      return false;
    }

    if (workspace.ownerId === userId) {
      return true;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      select: { role: true },
    });

    if (!membership) {
      return false;
    }

    return WORKSPACE_ROLE_RANK[membership.role] >= WORKSPACE_ROLE_RANK[minimumRole];
  }

  async hasBoardAccess(
    boardId: string,
    userId: string,
    minimumRole: BoardRole,
  ): Promise<boolean> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: {
        workspace: { select: { ownerId: true } },
      },
    });

    if (!board) {
      return false;
    }

    if (board.workspace.ownerId === userId) {
      return true;
    }

    const membership = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: { boardId, userId },
      },
      select: { role: true },
    });

    if (!membership) {
      return false;
    }

    return BOARD_ROLE_RANK[membership.role] >= BOARD_ROLE_RANK[minimumRole];
  }

  async assertWorkspaceMember(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      return;
    }

    if (workspace.ownerId === userId) {
      return;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!membership) {
      throw new Error('NOT_WORKSPACE_MEMBER');
    }
  }

  async assertBoardMember(boardId: string, userId: string): Promise<void> {
    const hasAccess = await this.hasBoardAccess(boardId, userId, 'VIEWER');
    if (!hasAccess) {
      throw new Error('NOT_BOARD_MEMBER');
    }
  }

  async ensureWorkspaceExists(workspaceId: string): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
  }

  async ensureBoardExists(boardId: string): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }
  }

  async getWorkspaceIdForBoardOrThrow(boardId: string): Promise<string> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { workspaceId: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board.workspaceId;
  }
}
