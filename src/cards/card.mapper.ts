import { Card, CardPriority, Prisma, User } from '../generated/prisma-client/client';
import { z } from 'zod';
import { PublicUser, toPublicUser } from '../users/user.mapper';
import { CardSchema } from './dto/card-responses.dto';

export const cardInclude = {
  assignees: {
    include: {
      user: true,
    },
  },
} satisfies Prisma.CardInclude;

export type CardWithAssignees = Card & {
  assignees: Array<{ user: User }>;
};

export type CardResponse = z.infer<typeof CardSchema>;

export function toCardResponse(card: CardWithAssignees): CardResponse {
  return {
    id: card.id,
    columnId: card.columnId,
    title: card.title,
    description: card.description,
    createdAt: card.createdAt.toISOString(),
    dueDate: card.dueDate?.toISOString() ?? null,
    priority: card.priority,
    category: card.category,
    position: card.position,
    assignees: card.assignees.map((assignment) => toPublicUser(assignment.user)),
  };
}
