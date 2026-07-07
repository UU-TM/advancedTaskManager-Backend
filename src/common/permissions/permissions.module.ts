import { Global, Module } from '@nestjs/common';
import { BoardRoleGuard } from './board-role.guard';
import { BoardWorkspaceRoleGuard } from './board-workspace-role.guard';
import { PermissionsService } from './permissions.service';
import { WorkspaceRoleGuard } from './workspace-role.guard';

@Global()
@Module({
  providers: [
    PermissionsService,
    WorkspaceRoleGuard,
    BoardRoleGuard,
    BoardWorkspaceRoleGuard,
  ],
  exports: [
    PermissionsService,
    WorkspaceRoleGuard,
    BoardRoleGuard,
    BoardWorkspaceRoleGuard,
  ],
})
export class PermissionsModule {}
