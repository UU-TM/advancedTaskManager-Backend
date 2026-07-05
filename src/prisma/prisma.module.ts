import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Infrastructure module exposing the shared PrismaService.
 *
 * Marked @Global() so feature modules can inject PrismaService without
 * re-importing PrismaModule everywhere — an accepted exception to the
 * strict one-directional import rule for infrastructure.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
