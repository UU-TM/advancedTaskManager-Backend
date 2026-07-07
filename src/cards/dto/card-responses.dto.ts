import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PublicUserSchema } from '../../users/dto/user-responses.dto';

export const CardSchema = z
  .object({
    id: z.string().uuid(),
    columnId: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    dueDate: z.string().datetime().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullable(),
    category: z.string().nullable(),
    position: z.number(),
    assignees: z.array(PublicUserSchema),
  })
  .meta({ id: 'Card' });

export class CardDto extends createZodDto(CardSchema) {}
