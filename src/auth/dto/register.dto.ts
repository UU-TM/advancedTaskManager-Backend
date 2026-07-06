import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
