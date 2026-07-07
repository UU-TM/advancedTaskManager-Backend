import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt-access.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UuidParam } from '../common/decorators/uuid-param.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AssignCardDto } from './dto/assign-card.dto';
import { CardDto } from './dto/card-responses.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { CardsService } from './cards.service';

@ApiTags('Cards')
@Controller('cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a card' })
  @ApiCreatedResponse({ type: CardDto.Output })
  @ApiNotFoundResponse({ description: 'Column not found' })
  @ApiForbiddenResponse({ description: 'Insufficient board permissions' })
  @ResponseMessage('Card created')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(dto, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a card with assignees' })
  @ApiOkResponse({ type: CardDto.Output })
  @ApiNotFoundResponse({ description: 'Card not found' })
  @ApiForbiddenResponse({ description: 'Insufficient board permissions' })
  @ResponseMessage('Card retrieved')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @UuidParam('id') cardId: string,
  ) {
    return this.cardsService.findById(cardId, user.userId);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move a card between columns or reorder within a column' })
  @ApiOkResponse({ type: CardDto.Output })
  @ApiNotFoundResponse({ description: 'Card or anchor not found' })
  @ApiBadRequestResponse({ description: 'Invalid move target' })
  @ApiForbiddenResponse({ description: 'Insufficient board permissions' })
  @ResponseMessage('Card moved')
  move(
    @CurrentUser() user: AuthenticatedUser,
    @UuidParam('id') cardId: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardsService.move(cardId, dto, user.userId);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a user to a card' })
  @ApiCreatedResponse({ type: CardDto.Output })
  @ApiNotFoundResponse({ description: 'Card or user not found' })
  @ApiBadRequestResponse({ description: 'Assignee must be a board member' })
  @ApiForbiddenResponse({ description: 'Insufficient board permissions' })
  @ResponseMessage('Assignee added')
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @UuidParam('id') cardId: string,
    @Body() dto: AssignCardDto,
  ) {
    return this.cardsService.assign(cardId, dto, user.userId);
  }

  @Delete(':id/assign/:userId')
  @ApiOperation({ summary: 'Remove an assignee from a card' })
  @ApiOkResponse({ type: CardDto.Output })
  @ApiNotFoundResponse({ description: 'Card not found' })
  @ApiForbiddenResponse({ description: 'Insufficient board permissions' })
  @ResponseMessage('Assignee removed')
  removeAssignee(
    @CurrentUser() user: AuthenticatedUser,
    @UuidParam('id') cardId: string,
    @UuidParam('userId') assigneeId: string,
  ) {
    return this.cardsService.removeAssignee(cardId, assigneeId, user.userId);
  }
}
