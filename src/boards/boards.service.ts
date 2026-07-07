import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Column } from '../generated/prisma-client/client';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  toBoardMemberResponse,
  toBoardResponse,
  toColumnResponse,
} from './board.mapper';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { BoardsRepository } from './boards.repository';

@Injectable()
export class BoardsService {
  constructor(
    private readonly boardsRepository: BoardsRepository,
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
  ) {}

  async create(workspaceId: string, dto: CreateBoardDto) {
    const board = await this.boardsRepository.create({
      workspaceId,
      name: dto.name,
    });

    return toBoardResponse(board);
  }

  async createColumn(boardId: string, dto: CreateColumnDto) {
    const board = await this.boardsRepository.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const column = await this.boardsRepository.createColumn({
      boardId,
      title: dto.title,
    });

    return toColumnResponse(column);
  }

  async addMember(boardId: string, dto: AddBoardMemberDto) {
    const board = await this.boardsRepository.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const user = await this.usersService.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.workspacesService.assertMember(board.workspaceId, dto.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('User must be a workspace member');
    }

    const member = await this.boardsRepository.upsertMember({
      boardId,
      userId: dto.userId,
      role: dto.role,
    });

    return toBoardMemberResponse(member);
  }

  async getColumnOrThrow(columnId: string): Promise<Column> {
    const column = await this.boardsRepository.findColumnById(columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column;
  }

  async getBoardIdForColumn(columnId: string): Promise<string> {
    const column = await this.getColumnOrThrow(columnId);
    return column.boardId;
  }
}
