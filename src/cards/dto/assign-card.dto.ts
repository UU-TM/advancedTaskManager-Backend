import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignCardSchema = z.object({
  userId: z.string().uuid(),
});

export class AssignCardDto extends createZodDto(AssignCardSchema) {}
