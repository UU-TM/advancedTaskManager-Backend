import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UuidParam } from '../common/decorators/uuid-param.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import {
  RequireBoardRole,
  RequireWorkspaceRole,
  RequireWorkspaceRoleForBoard,
} from '../common/permissions/decorators';
import { BoardRoleGuard } from '../common/permissions/board-role.guard';
import { BoardWorkspaceRoleGuard } from '../common/permissions/board-workspace-role.guard';
import { WorkspaceRoleGuard } from '../common/permissions/workspace-role.guard';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import {
  BoardDto,
  BoardMemberDto,
  ColumnDto,
} from './dto/board-responses.dto';
import { BoardsService } from './boards.service';

@ApiTags('Boards')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse()
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post('workspaces/:id/boards')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('ADMIN', 'id')
  @ApiOperation({ summary: 'Create a board in a workspace' })
  @ApiCreatedResponse({ type: BoardDto.Output })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @ResponseMessage('Board created')
  createBoard(
    @UuidParam('id') workspaceId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardsService.create(workspaceId, dto);
  }

  @Post('boards/:id/columns')
  @UseGuards(BoardRoleGuard)
  @RequireBoardRole('EDITOR', 'id')
  @ApiOperation({ summary: 'Create a column on a board' })
  @ApiCreatedResponse({ type: ColumnDto.Output })
  @ApiNotFoundResponse({ description: 'Board not found' })
  @ResponseMessage('Column created')
  createColumn(
    @UuidParam('id') boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.boardsService.createColumn(boardId, dto);
  }

  @Post('boards/:id/members')
  @UseGuards(BoardWorkspaceRoleGuard)
  @RequireWorkspaceRoleForBoard('ADMIN', 'id')
  @ApiOperation({ summary: 'Add a user to a board' })
  @ApiCreatedResponse({ type: BoardMemberDto.Output })
  @ApiNotFoundResponse({ description: 'Board or user not found' })
  @ApiBadRequestResponse({ description: 'User is not a workspace member' })
  @ApiForbiddenResponse({ description: 'Insufficient workspace permissions' })
  @ResponseMessage('Board member added')
  addMember(
    @UuidParam('id') boardId: string,
    @Body() dto: AddBoardMemberDto,
  ) {
    return this.boardsService.addMember(boardId, dto);
  }
}
