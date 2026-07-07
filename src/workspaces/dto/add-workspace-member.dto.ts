import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddWorkspaceMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export class AddWorkspaceMemberDto extends createZodDto(
  AddWorkspaceMemberSchema,
) {}
