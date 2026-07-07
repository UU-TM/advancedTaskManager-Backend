import { User } from '../generated/prisma-client/client';

export interface PublicUser {
  id: string;
  username: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username };
}
