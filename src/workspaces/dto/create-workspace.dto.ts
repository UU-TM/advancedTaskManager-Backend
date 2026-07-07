import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});

export class CreateWorkspaceDto extends createZodDto(CreateWorkspaceSchema) {}
