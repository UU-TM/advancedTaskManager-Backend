import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCardSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().trim().optional(),
});

export class CreateCardDto extends createZodDto(CreateCardSchema) {}
