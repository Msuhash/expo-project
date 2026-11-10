import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { User } from '../../generated/prisma/client.js';
import type { UpdateUserDto, UserResponseDto } from '../auth/dto/user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user profile by ID.
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSafeUser(user);
  }

  /**
   * Find user by username (exact match, normalized lowercase).
   */
  async findByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(`User with username '${username}' not found`);
    }
    return this.toSafeUser(user);
  }

  /**
   * Search registered users by username or email for invitations.
   */
  async search(query: string): Promise<UserResponseDto[]> {
    const normalized = query.trim().toLowerCase();
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: normalized, mode: 'insensitive' } },
          { email: { contains: normalized, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
    return users.map((u: User) => this.toSafeUser(u));
  }

  /**
   * Update authenticated user's own profile.
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: updateDto.displayName,
      },
    });
    return this.toSafeUser(user);
  }

  /**
   * Converts raw User database record to safe response DTO without secrets.
   */
  private toSafeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
