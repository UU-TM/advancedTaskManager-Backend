import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PublicUser, toPublicUser } from '../users/user.mapper';
import { UsersService } from '../users/users.service';

const SALT_ROUNDS = 12;

const DUMMY_HASH = bcrypt.hashSync('unused-dummy-password', SALT_ROUNDS);

export interface JwtPayload {
  sub: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends TokenPair {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: {
    username: string;
    password: string;
  }): Promise<PublicUser> {
    const existing = await this.usersService.findByUsername(input.username);
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await this.hashPassword(input.password);
    const user = await this.usersService.create({
      username: input.username,
      passwordHash,
    });

    return toPublicUser(user);
  }

  async login(input: {
    username: string;
    password: string;
  }): Promise<LoginResult> {
    const user = await this.usersService.findByUsername(input.username);

    const passwordMatches = await this.comparePassword(
      input.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.username);
    await this.storeRefreshHash(user.id, tokens.refreshToken);

    return { ...tokens, user: toPublicUser(user) };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return toPublicUser(user);
  }

  async refresh(
    userId: string,
    presentedRefreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const matches = await this.comparePassword(
      presentedRefreshToken,
      user.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user.id, user.username);
    await this.storeRefreshHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  private comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private async issueTokens(
    userId: string,
    username: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m'),
      } as JwtSignOptions),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d'),
      } as JwtSignOptions),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.usersService.setRefreshTokenHash(userId, hash);
  }
}
