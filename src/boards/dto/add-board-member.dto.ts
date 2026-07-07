import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddBoardMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['VIEWER', 'EDITOR']),
});

export class AddBoardMemberDto extends createZodDto(AddBoardMemberSchema) {}
