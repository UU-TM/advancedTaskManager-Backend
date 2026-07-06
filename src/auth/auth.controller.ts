import { Body, Controller, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ResponseMessage('User registered')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
