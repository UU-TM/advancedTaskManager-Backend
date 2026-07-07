import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PublicUserSchema } from '../../users/dto/user-responses.dto';

export const TokenPairSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .meta({ id: 'TokenPair' });

export class TokenPairDto extends createZodDto(TokenPairSchema) {}

export const LoginResultSchema = TokenPairSchema.extend({
  user: PublicUserSchema,
}).meta({ id: 'LoginResult' });

export class LoginResultDto extends createZodDto(LoginResultSchema) {}
