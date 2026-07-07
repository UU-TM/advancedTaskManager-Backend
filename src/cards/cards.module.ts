import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { UsersModule } from '../users/users.module';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';

@Module({
  imports: [BoardsModule, UsersModule],
  controllers: [CardsController],
  providers: [CardsService, CardsRepository],
})
export class CardsModule {}
