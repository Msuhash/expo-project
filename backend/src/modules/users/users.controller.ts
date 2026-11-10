import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UpdateUserDto, type UserResponseDto } from '../auth/dto/user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Search registered users by username or email.
   */
  @Get('search')
  async search(@Query('q') query: string): Promise<UserResponseDto[]> {
    return this.usersService.search(query ?? '');
  }

  /**
   * Update authenticated user's own profile.
   */
  @Patch('profile')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(userId, updateDto);
  }

  /**
   * Get user by ID.
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}
