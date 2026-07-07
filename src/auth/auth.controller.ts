import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AuthService } from './auth.service';
import { PublicUserDto } from '../users/dto/user-responses.dto';
import { LoginResultDto, TokenPairDto } from './dto/auth-responses.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { AuthenticatedUser } from './strategies/jwt-access.strategy';
import type { RefreshTokenUser } from './strategies/jwt-refresh.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: PublicUserDto.Output })
  @ApiConflictResponse({ description: 'Username already taken' })
  @ResponseMessage('User registered')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiOkResponse({ type: LoginResultDto.Output })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ResponseMessage('Login successful')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: PublicUserDto.Output })
  @ApiUnauthorizedResponse()
  @ResponseMessage('User profile retrieved')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
    description:
      'Send the refresh token in the request body. The access token is not required.',
  })
  @ApiOkResponse({ type: TokenPairDto.Output })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @ResponseMessage('Token refreshed')
  refresh(@CurrentUser() user: RefreshTokenUser, @Body() _dto: RefreshDto) {
    return this.authService.refresh(user.userId, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and invalidate the refresh token' })
  @ApiOkResponse({ schema: { type: 'object', properties: {} } })
  @ApiUnauthorizedResponse()
  @ResponseMessage('Logged out')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.userId);
    return {};
  }
}
