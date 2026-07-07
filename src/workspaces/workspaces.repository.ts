import { Injectable } from '@nestjs/common';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '../generated/prisma-client/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithOwnerMembership(data: {
    name: string;
    ownerId: string;
  }): Promise<Workspace> {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          ownerId: data.ownerId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: data.ownerId,
          role: WorkspaceRole.ADMIN,
        },
      });

      return workspace;
    });
  }

  findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  upsertMember(data: {
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: data.workspaceId,
          userId: data.userId,
        },
      },
      create: data,
      update: { role: data.role },
    });
  }

  isMember(workspaceId: string, userId: string): Promise<boolean> {
    return this.prisma.workspaceMember
      .findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
      })
      .then((member) => member !== null);
  }
}
