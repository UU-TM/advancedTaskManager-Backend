import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBoardSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});

export class CreateBoardDto extends createZodDto(CreateBoardSchema) {}
