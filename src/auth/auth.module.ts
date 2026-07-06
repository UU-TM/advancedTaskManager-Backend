import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    // Empty registration: secret + expiry are passed explicitly per sign
    // call, since access and refresh use separate secrets.
    JwtModule.register({}),
    UsersModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
