import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PublicUserSchema = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
  })
  .meta({ id: 'PublicUser' });

export class PublicUserDto extends createZodDto(PublicUserSchema) {}
