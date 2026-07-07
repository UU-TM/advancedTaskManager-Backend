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
import { WORKSPACE_ROLE_KEY } from './permissions.constants';
import { PermissionsService } from './permissions.service';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<{
      role: WorkspaceRole;
      param: string;
    }>(WORKSPACE_ROLE_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    const rawWorkspaceId = request.params[metadata.param];
    const workspaceId = Array.isArray(rawWorkspaceId)
      ? rawWorkspaceId[0]
      : rawWorkspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace id is required');
    }

    await this.permissionsService.ensureWorkspaceExists(workspaceId);

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
