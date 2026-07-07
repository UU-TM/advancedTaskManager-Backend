import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UuidParam } from '../common/decorators/uuid-param.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { RequireWorkspaceRole } from '../common/permissions/decorators';
import { WorkspaceRoleGuard } from '../common/permissions/workspace-role.guard';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import {
  WorkspaceDto,
  WorkspaceMemberDto,
} from './dto/workspace-responses.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiCreatedResponse({ type: WorkspaceDto.Output })
  @ResponseMessage('Workspace created')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.userId, dto);
  }

  @Post(':id/members')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('ADMIN')
  @ApiOperation({ summary: 'Invite or add a user to a workspace' })
  @ApiCreatedResponse({ type: WorkspaceMemberDto.Output })
  @ApiNotFoundResponse({ description: 'Workspace or user not found' })
  @ResponseMessage('Workspace member added')
  addMember(
    @UuidParam('id') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(workspaceId, dto);
  }
}
