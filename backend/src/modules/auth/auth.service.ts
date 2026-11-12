import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service.js';
import type { User } from '../../generated/prisma/client.js';
import type { LoginDto, SignupDto, UserResponseDto } from './dto/user.dto.js';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';

export interface AuthResponse {
  accessToken: string;
  user: UserResponseDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new platform user.
   * Enforces uniqueness for email and username, hashes password, and returns a safe response.
   */
  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: signupDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: signupDto.username,
        email: signupDto.email,
        passwordHash,
        displayName: signupDto.displayName ?? null,
        bio: signupDto.bio ?? null,
      },
    });

    const accessToken = await this.generateToken(user);

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Authenticate an existing user by email and password.
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.generateToken(user);

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Fetch current authenticated user's safe profile.
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSafeUser(user);
  }

  /**
   * Generates a signed JWT access token using the configured secret and expiry.
   */
  private async generateToken(user: {
    id: string;
    username: string;
    email: string;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Transform database User model into safe response format (without passwordHash).
   */
  private toSafeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
