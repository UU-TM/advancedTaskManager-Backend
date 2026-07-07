import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { WorkspaceRole } from '../../generated/prisma-client/client';
import { AuthenticatedUser } from '../../auth/strategies/jwt-access.strategy';
import { BOARD_WORKSPACE_ROLE_KEY } from './permissions.constants';
import { PermissionsService } from './permissions.service';

@Injectable()
export class BoardWorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<{
      role: WorkspaceRole;
      param: string;
    }>(BOARD_WORKSPACE_ROLE_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    const rawBoardId = request.params[metadata.param];
    const boardId = Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId;

    if (!boardId) {
      throw new ForbiddenException('Board id is required');
    }

    const workspaceId =
      await this.permissionsService.getWorkspaceIdForBoardOrThrow(boardId);

    const allowed = await this.permissionsService.hasWorkspaceAccess(
      workspaceId,
      user.userId,
      metadata.role,
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    return true;
  }
}
