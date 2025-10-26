// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, AuthResponseDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usersService.updateLastLogin(user.id);

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.usersService.findByEmail(payload.email);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Token inválido');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Token inválido');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    await this.usersService.updateRefreshToken(
      user.id,
      refreshToken,
    );

    // Convertir a objeto plano y eliminar campos sensibles
    const userObject = user.toObject();
    delete (userObject as any).password;
    delete (userObject as any).refreshToken;

    return {
      user: userObject as any,
      accessToken,
      refreshToken,
    };
  }

  async validateUserById(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }
}