import { Injectable } from '@nestjs/common';
import { User } from '../generated/prisma-client/client';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  create(data: { username: string; passwordHash: string }): Promise<User> {
    return this.usersRepository.create(data);
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  setRefreshTokenHash(userId: string, hash: string | null): Promise<User> {
    return this.usersRepository.setRefreshTokenHash(userId, hash);
  }
}
