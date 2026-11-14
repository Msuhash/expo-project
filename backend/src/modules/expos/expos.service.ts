import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  ExpoRole,
  ExpoStatus,
  MembershipStatus,
} from '../../generated/prisma/client.js';
import type { CreateExpoDto } from './dto/create-expo.dto.js';
import type {
  ExpoCategoryResponseDto,
  ExpoResponseDto,
} from './dto/expo-response.dto.js';
import type { UpdateExpoDto } from './dto/update-expo.dto.js';

interface ExpoWithRelations {
  id: string;
  createdById: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  startAt: Date;
  endAt: Date;
  venueName: string;
  venueAddress: string;
  capacity: number | null;
  status: ExpoStatus;
  registrationEnabled: boolean;
  registrationDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    username: string;
    displayName: string | null;
  };
  categories?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

@Injectable()
export class ExposService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create an expo and atomically assign the creator as Admin.
   */
  async createExpo(
    userId: string,
    dto: CreateExpoDto,
  ): Promise<ExpoResponseDto> {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);

    if (end <= start) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const slug = dto.slug ? dto.slug.toLowerCase().trim() : this.slugify(dto.name);
    const existingSlug = await this.prisma.expo.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`An expo with slug '${slug}' already exists`);
    }

    if (dto.registrationDeadline) {
      const deadline = new Date(dto.registrationDeadline);
      if (deadline > end) {
        throw new BadRequestException(
          'registrationDeadline cannot be after endAt',
        );
      }
    }

    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const count = await this.prisma.category.count({
        where: { id: { in: dto.categoryIds } },
      });
      if (count !== dto.categoryIds.length) {
        throw new BadRequestException(
          'One or more selected category IDs are invalid',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const expo = await tx.expo.create({
        data: {
          createdById: userId,
          name: dto.name,
          slug,
          description: dto.description ?? null,
          coverImageUrl: dto.coverImageUrl ?? null,
          startAt: start,
          endAt: end,
          venueName: dto.venueName,
          venueAddress: dto.venueAddress,
          capacity: dto.capacity ?? null,
          status: dto.status ?? ExpoStatus.Draft,
          registrationEnabled: dto.registrationEnabled ?? false,
          registrationDeadline: dto.registrationDeadline
            ? new Date(dto.registrationDeadline)
            : null,
          categories:
            dto.categoryIds && dto.categoryIds.length > 0
              ? {
                create: dto.categoryIds.map((categoryId) => ({ categoryId })),
              }
              : undefined,
        },
        include: {
          createdBy: {
            select: { id: true, username: true, displayName: true },
          },
          categories: {
            include: { category: true },
          },
        },
      });

      // Atomically create creator's Admin membership
      await tx.expoMembership.create({
        data: {
          expoId: expo.id,
          userId,
          role: ExpoRole.Admin,
          status: MembershipStatus.Active,
        },
      });

      return this.toExpoResponse(expo, ExpoRole.Admin);
    });
  }

  /**
   * List all published, ongoing, or completed expos for public exploration.
   */
  async findAllExpos(): Promise<ExpoResponseDto[]> {
    const expos = await this.prisma.expo.findMany({
      where: {
        status: {
          in: [
            ExpoStatus.Published,
            ExpoStatus.Ongoing,
            ExpoStatus.Completed,
          ],
        },
      },
      include: {
        createdBy: {
          select: { id: true, username: true, displayName: true },
        },
        categories: {
          include: { category: true },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return expos.map((expo) => this.toExpoResponse(expo, null));
  }

  /**
   * Get all expos where the authenticated user is an active team member.
   */
  async findAllForUser(userId: string): Promise<ExpoResponseDto[]> {
    const memberships = await this.prisma.expoMembership.findMany({
      where: {
        userId,
        status: MembershipStatus.Active,
      },
      include: {
        expo: {
          include: {
            createdBy: {
              select: { id: true, username: true, displayName: true },
            },
            categories: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: {
        expo: {
          createdAt: 'desc',
        },
      },
    });

    return memberships.map((m) => this.toExpoResponse(m.expo, m.role));
  }

  /**
   * Find an expo by ID or slug.
   * Enforces private visibility if status is Draft.
   */
  async findOne(
    identifier: string,
    userId?: string,
  ): Promise<ExpoResponseDto> {
    const expo = await this.prisma.expo.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        createdBy: {
          select: { id: true, username: true, displayName: true },
        },
        categories: {
          include: { category: true },
        },
      },
    });

    if (!expo) {
      throw new NotFoundException(`Expo '${identifier}' not found`);
    }

    let myRole: ExpoRole | null = null;
    if (userId) {
      const membership = await this.prisma.expoMembership.findUnique({
        where: {
          expoId_userId: {
            expoId: expo.id,
            userId,
          },
        },
      });
      if (membership && membership.status === MembershipStatus.Active) {
        myRole = membership.role;
      }
    }

    if (expo.status === ExpoStatus.Draft && !myRole) {
      throw new ForbiddenException(
        'This expo is in Draft status and is only visible to active team members',
      );
    }

    return this.toExpoResponse(expo, myRole);
  }

  /**
   * Update expo settings. Restricted to active Admins.
   */
  async updateExpo(
    expoId: string,
    userId: string,
    dto: UpdateExpoDto,
  ): Promise<ExpoResponseDto> {
    const membership = await this.prisma.expoMembership.findUnique({
      where: {
        expoId_userId: {
          expoId,
          userId,
        },
      },
    });

    if (
      !membership ||
      membership.status !== MembershipStatus.Active ||
      membership.role !== ExpoRole.Admin
    ) {
      throw new ForbiddenException(
        'Only an active Admin can update expo details',
      );
    }

    const currentExpo = await this.prisma.expo.findUnique({
      where: { id: expoId },
    });
    if (!currentExpo) {
      throw new NotFoundException('Expo not found');
    }

    const start = dto.startAt ? new Date(dto.startAt) : currentExpo.startAt;
    const end = dto.endAt ? new Date(dto.endAt) : currentExpo.endAt;

    if (end <= start) {
      throw new BadRequestException('endAt must be after startAt');
    }

    let slug = currentExpo.slug;
    if (dto.slug && dto.slug !== currentExpo.slug) {
      slug = dto.slug.toLowerCase().trim();
      const existing = await this.prisma.expo.findUnique({
        where: { slug },
      });
      if (existing && existing.id !== expoId) {
        throw new ConflictException(
          `An expo with slug '${slug}' already exists`,
        );
      }
    }

    if (dto.categoryIds) {
      const count = await this.prisma.category.count({
        where: { id: { in: dto.categoryIds } },
      });
      if (count !== dto.categoryIds.length) {
        throw new BadRequestException(
          'One or more selected category IDs are invalid',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.categoryIds) {
        await tx.expoCategory.deleteMany({
          where: { expoId },
        });
      }

      const updated = await tx.expo.update({
        where: { id: expoId },
        data: {
          ...(dto.name && { name: dto.name }),
          slug,
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.coverImageUrl !== undefined && {
            coverImageUrl: dto.coverImageUrl,
          }),
          startAt: start,
          endAt: end,
          ...(dto.venueName && { venueName: dto.venueName }),
          ...(dto.venueAddress && { venueAddress: dto.venueAddress }),
          ...(dto.capacity !== undefined && { capacity: dto.capacity }),
          ...(dto.status && { status: dto.status }),
          ...(dto.registrationEnabled !== undefined && {
            registrationEnabled: dto.registrationEnabled,
          }),
          ...(dto.registrationDeadline !== undefined && {
            registrationDeadline: dto.registrationDeadline
              ? new Date(dto.registrationDeadline)
              : null,
          }),
          ...(dto.categoryIds && {
            categories: {
              create: dto.categoryIds.map((categoryId) => ({ categoryId })),
            },
          }),
        },
        include: {
          createdBy: {
            select: { id: true, username: true, displayName: true },
          },
          categories: {
            include: { category: true },
          },
        },
      });

      return this.toExpoResponse(updated, membership.role);
    });
  }


  /**
   * Delete an expo workspace.
   * Only expos in Draft status can be deleted to protect active/historical events.
   */
  async deleteExpo(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const expo = await this.prisma.expo.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!expo) {
      throw new NotFoundException(`Expo with ID '${id}' not found`);
    }

    if (expo.status !== ExpoStatus.Draft) {
      throw new BadRequestException(
        'Only expos in Draft status can be deleted. Published, ongoing, or completed expos must be Cancelled instead.',
      );
    }

    await this.prisma.expo.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Expo deleted successfully',
    };
  }

  /**
   * Fetch all reusable categories for expo selection.
   */
  async getCategories(): Promise<ExpoCategoryResponseDto[]> {
    return this.prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Transform internal expo record to safe response DTO.
   */
  private toExpoResponse(
    expo: ExpoWithRelations,
    myRole: ExpoRole | null = null,
  ): ExpoResponseDto {
    return {
      id: expo.id,
      createdById: expo.createdById,
      name: expo.name,
      slug: expo.slug,
      description: expo.description,
      coverImageUrl: expo.coverImageUrl,
      startAt: expo.startAt,
      endAt: expo.endAt,
      venueName: expo.venueName,
      venueAddress: expo.venueAddress,
      capacity: expo.capacity,
      status: expo.status,
      registrationEnabled: expo.registrationEnabled,
      registrationDeadline: expo.registrationDeadline,
      createdAt: expo.createdAt,
      updatedAt: expo.updatedAt,
      createdBy: expo.createdBy,
      categories:
        expo.categories?.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
        })) ?? [],
      myRole,
    };
  }

  /**
   * Generate slug from name.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
  }
}
