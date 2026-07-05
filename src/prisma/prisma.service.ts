import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Single shared database connection for the application.
 *
 * Extends the generated PrismaClient and ties its lifecycle to the Nest
 * module lifecycle: connect once the module is initialised, disconnect on
 * shutdown so the pool is released cleanly.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
