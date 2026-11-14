import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ExpoAccessGuard } from '../../common/guards/expo-access.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import { ExpoRole } from '../../generated/prisma/client.js';
import { CreateExpoDto } from './dto/create-expo.dto.js';
import type {
  ExpoCategoryResponseDto,
  ExpoResponseDto,
} from './dto/expo-response.dto.js';
import { UpdateExpoDto } from './dto/update-expo.dto.js';
import { ExposService } from './expos.service.js';

@Controller('expos')
export class ExposController {
  constructor(private readonly exposService: ExposService) { }

  /**
   * Create an expo workspace.
   * Atomically assigns the creator as an active Admin.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createExpoDto: CreateExpoDto,
  ): Promise<ExpoResponseDto> {
    return this.exposService.createExpo(userId, createExpoDto);
  }

  /**
   * List all expos where the authenticated user is an active team member.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser('userId') userId: string,
  ): Promise<ExpoResponseDto[]> {
    return this.exposService.findAllForUser(userId);
  }

  /**
   * List all published/active expos for public discovery.
   * Placed before :idOrSlug route to avoid route collisions.
   */
  @Get('explore')
  async findAllExpos(): Promise<ExpoResponseDto[]> {
    return this.exposService.findAllExpos();
  }

  /**
   * Get all reusable categories for expo categorization.
   * Placed before :idOrSlug route to avoid route collisions.
   */
  @Get('categories')
  async getCategories(): Promise<ExpoCategoryResponseDto[]> {
    return this.exposService.getCategories();
  }

  /**
   * Get an expo by ID or unique slug.
   * Resolves caller's membership role if authenticated.
   * Forbids unauthenticated/non-member access to Draft expos.
   */
  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser('userId') userId?: string,
  ): Promise<ExpoResponseDto> {
    return this.exposService.findOne(idOrSlug, userId);
  }

  /**
   * Update expo settings.
   * Strictly restricted to active Admin members.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, ExpoAccessGuard)
  @Roles(ExpoRole.Admin)
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateExpoDto: UpdateExpoDto,
  ): Promise<ExpoResponseDto> {
    return this.exposService.updateExpo(id, userId, updateExpoDto);
  }

  /**
   * Delete an expo workspace.
   * Strictly restricted to active Admin members and Draft-status expos.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ExpoAccessGuard)
  @Roles(ExpoRole.Admin)
  async deleteExpo(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.exposService.deleteExpo(id);
  }
}

