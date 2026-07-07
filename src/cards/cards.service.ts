import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionsService } from '../common/permissions/permissions.service';
import { BoardsService } from '../boards/boards.service';
import { UsersService } from '../users/users.service';
import { toCardResponse } from './card.mapper';
import { CardsRepository } from './cards.repository';
import { AssignCardDto } from './dto/assign-card.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly boardsService: BoardsService,
    private readonly permissionsService: PermissionsService,
    private readonly usersService: UsersService,
  ) {}

  private async assertEditor(boardId: string, userId: string): Promise<void> {
    const allowed = await this.permissionsService.hasBoardAccess(
      boardId,
      userId,
      'EDITOR',
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient board permissions');
    }
  }

  async create(dto: CreateCardDto, userId: string) {
    const column = await this.boardsService.getColumnOrThrow(dto.columnId);
    await this.assertEditor(column.boardId, userId);

    const card = await this.cardsRepository.create({
      columnId: dto.columnId,
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority,
      category: dto.category,
    });

    return toCardResponse(card);
  }

  async findById(cardId: string, userId: string) {
    const card = await this.cardsRepository.findById(cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const boardId = await this.cardsRepository.getBoardIdForCard(cardId);
    if (!boardId) {
      throw new NotFoundException('Card not found');
    }

    const allowed = await this.permissionsService.hasBoardAccess(
      boardId,
      userId,
      'VIEWER',
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient board permissions');
    }

    return toCardResponse(card);
  }

  async move(cardId: string, dto: MoveCardDto, userId: string) {
    const existingCard = await this.cardsRepository.findById(cardId);
    if (!existingCard) {
      throw new NotFoundException('Card not found');
    }

    const sourceColumn = await this.boardsService.getColumnOrThrow(
      existingCard.columnId,
    );
    const targetColumn = await this.boardsService.getColumnOrThrow(
      dto.columnId,
    );

    if (sourceColumn.boardId !== targetColumn.boardId) {
      throw new BadRequestException('Cannot move card to a different board');
    }

    await this.assertEditor(sourceColumn.boardId, userId);

    try {
      const card = await this.cardsRepository.moveCard(
        cardId,
        dto.columnId,
        dto.afterCardId,
        dto.beforeCardId,
      );
      return toCardResponse(card);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'AFTER_CARD_NOT_FOUND') {
          throw new NotFoundException('Anchor card not found in target column');
        }
        if (error.message === 'BEFORE_CARD_NOT_FOUND') {
          throw new NotFoundException('Anchor card not found in target column');
        }
      }
      throw error;
    }
  }

  async assign(cardId: string, dto: AssignCardDto, userId: string) {
    const boardId = await this.cardsRepository.getBoardIdForCard(cardId);
    if (!boardId) {
      throw new NotFoundException('Card not found');
    }

    await this.assertEditor(boardId, userId);

    const assignee = await this.usersService.findById(dto.userId);
    if (!assignee) {
      throw new NotFoundException('User not found');
    }

    const hasAccess = await this.permissionsService.hasBoardAccess(
      boardId,
      dto.userId,
      'VIEWER',
    );
    if (!hasAccess) {
      throw new BadRequestException('Assignee must be a board member');
    }

    const card = await this.cardsRepository.assignUser(cardId, dto.userId);
    return toCardResponse(card);
  }

  async removeAssignee(cardId: string, assigneeId: string, userId: string) {
    const boardId = await this.cardsRepository.getBoardIdForCard(cardId);
    if (!boardId) {
      throw new NotFoundException('Card not found');
    }

    await this.assertEditor(boardId, userId);

    const card = await this.cardsRepository.removeAssignee(cardId, assigneeId);
    return toCardResponse(card);
  }
}
