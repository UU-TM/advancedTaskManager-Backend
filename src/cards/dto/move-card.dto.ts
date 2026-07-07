import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MoveCardSchema = z
  .object({
    columnId: z.string().uuid(),
    afterCardId: z.string().uuid().optional(),
    beforeCardId: z.string().uuid().optional(),
  })
  .refine((data) => !(data.afterCardId && data.beforeCardId), {
    message: 'Provide at most one anchor card',
  });

export class MoveCardDto extends createZodDto(MoveCardSchema) {}
