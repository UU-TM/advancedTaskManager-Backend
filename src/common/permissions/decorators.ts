import { SetMetadata } from '@nestjs/common';
import { BoardRole, WorkspaceRole } from '../../generated/prisma-client/client';
import {
  BOARD_PARAM_KEY,
  BOARD_ROLE_KEY,
  BOARD_WORKSPACE_ROLE_KEY,
  WORKSPACE_PARAM_KEY,
  WORKSPACE_ROLE_KEY,
} from './permissions.constants';

export const RequireWorkspaceRole = (
  role: WorkspaceRole,
  param = 'id',
) => SetMetadata(WORKSPACE_ROLE_KEY, { role, param });

export const RequireBoardRole = (role: BoardRole, param = 'id') =>
  SetMetadata(BOARD_ROLE_KEY, { role, param });

export const RequireWorkspaceRoleForBoard = (
  role: WorkspaceRole,
  param = 'id',
) => SetMetadata(BOARD_WORKSPACE_ROLE_KEY, { role, param });

export { WORKSPACE_PARAM_KEY, BOARD_PARAM_KEY };
