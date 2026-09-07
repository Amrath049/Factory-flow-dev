import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const validEmail = this.configService.get<string>('AUTH_EMAIL');
    const validPassword = this.configService.get<string>('AUTH_PASSWORD');

    if (email !== validEmail || password !== validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: 'admin', email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
