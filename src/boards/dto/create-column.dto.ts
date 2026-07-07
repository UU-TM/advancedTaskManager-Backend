import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateColumnSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
});

export class CreateColumnDto extends createZodDto(CreateColumnSchema) {}
