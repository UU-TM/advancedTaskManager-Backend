import { Injectable } from '@nestjs/common';
import { CardPriority } from '../generated/prisma-client/client';
import {
  needsRebalance,
  nextAppendPosition,
  positionBetween,
  rebalancePositions,
} from '../common/position/position.util';
import { PrismaService } from '../prisma/prisma.service';
import { cardInclude, CardWithAssignees } from './card.mapper';

@Injectable()
export class CardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<CardWithAssignees | null> {
    return this.prisma.card.findUnique({
      where: { id },
      include: cardInclude,
    });
  }

  async create(data: {
    columnId: string;
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: CardPriority;
    category?: string;
  }): Promise<CardWithAssignees> {
    const lastCard = await this.prisma.card.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.card.create({
      data: {
        ...data,
        position: nextAppendPosition(lastCard?.position ?? null),
      },
      include: cardInclude,
    });
  }

  async moveCard(
    cardId: string,
    targetColumnId: string,
    afterCardId?: string,
    beforeCardId?: string,
  ): Promise<CardWithAssignees> {
    return this.prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: cardId },
        select: { id: true, columnId: true },
      });

      if (!card) {
        throw new Error('CARD_NOT_FOUND');
      }

      const targetCards = await tx.card.findMany({
        where: { columnId: targetColumnId },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });

      const filteredCards = targetCards.filter((item) => item.id !== cardId);

      let beforePosition: number | null = null;
      let afterPosition: number | null = null;

      if (afterCardId) {
        const afterIndex = filteredCards.findIndex(
          (item) => item.id === afterCardId,
        );
        if (afterIndex === -1) {
          throw new Error('AFTER_CARD_NOT_FOUND');
        }
        beforePosition = filteredCards[afterIndex].position;
        afterPosition = filteredCards[afterIndex + 1]?.position ?? null;
      } else if (beforeCardId) {
        const beforeIndex = filteredCards.findIndex(
          (item) => item.id === beforeCardId,
        );
        if (beforeIndex === -1) {
          throw new Error('BEFORE_CARD_NOT_FOUND');
        }
        beforePosition = filteredCards[beforeIndex - 1]?.position ?? null;
        afterPosition = filteredCards[beforeIndex].position;
      } else {
        const lastCard = filteredCards.at(-1);
        beforePosition = lastCard?.position ?? null;
        afterPosition = null;
      }

      let newPosition = positionBetween(beforePosition, afterPosition);

      if (
        beforePosition !== null &&
        afterPosition !== null &&
        needsRebalance(beforePosition, afterPosition)
      ) {
        const insertIndex = afterCardId
          ? filteredCards.findIndex((item) => item.id === afterCardId) + 1
          : beforeCardId
            ? filteredCards.findIndex((item) => item.id === beforeCardId)
            : filteredCards.length;

        const rebalanced = rebalancePositions(filteredCards.length + 1);
        for (let index = 0; index < filteredCards.length; index++) {
          const rebalanceIndex = index < insertIndex ? index : index + 1;
          await tx.card.update({
            where: { id: filteredCards[index].id },
            data: { position: rebalanced[rebalanceIndex] },
          });
        }
        newPosition = rebalanced[insertIndex];
      }

      return tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          position: newPosition,
        },
        include: cardInclude,
      });
    });
  }

  assignUser(cardId: string, userId: string): Promise<CardWithAssignees> {
    return this.prisma.$transaction(async (tx) => {
      await tx.cardAssignee.upsert({
        where: {
          cardId_userId: { cardId, userId },
        },
        create: { cardId, userId },
        update: {},
      });

      const card = await tx.card.findUnique({
        where: { id: cardId },
        include: cardInclude,
      });

      if (!card) {
        throw new Error('CARD_NOT_FOUND');
      }

      return card;
    });
  }

  async removeAssignee(
    cardId: string,
    userId: string,
  ): Promise<CardWithAssignees> {
    await this.prisma.cardAssignee.deleteMany({
      where: { cardId, userId },
    });

    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: cardInclude,
    });

    if (!card) {
      throw new Error('CARD_NOT_FOUND');
    }

    return card;
  }

  getBoardIdForCard(cardId: string): Promise<string | null> {
    return this.prisma.card
      .findUnique({
        where: { id: cardId },
        select: { column: { select: { boardId: true } } },
      })
      .then((card) => card?.column.boardId ?? null);
  }
}
