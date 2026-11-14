import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service.js';
import {
  ExpoRole,
  ExpoStatus,
  MembershipStatus,
} from '../../generated/prisma/client.js';
import { ExposService } from './expos.service.js';

describe('ExposService', () => {
  let service: ExposService;
  let prisma: any;

  const mockExpo = {
    id: 'expo-1',
    createdById: 'user-1',
    name: 'Tech Conf 2026',
    slug: 'tech-conf-2026',
    description: 'Indoor tech conference',
    coverImageUrl: null,
    startAt: new Date('2026-11-20T09:00:00Z'),
    endAt: new Date('2026-11-22T18:00:00Z'),
    venueName: 'Expo Center',
    venueAddress: '123 Main St',
    capacity: 200,
    status: ExpoStatus.Draft,
    registrationEnabled: false,
    registrationDeadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: {
      id: 'user-1',
      username: 'johndoe',
      displayName: 'John Doe',
    },
    categories: [],
  };

  beforeEach(async () => {
    prisma = {
      expo: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      category: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      expoCategory: {
        deleteMany: vi.fn(),
      },
      expoMembership: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExposService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ExposService>(ExposService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExpo', () => {
    it('should throw BadRequestException if endAt is before startAt', async () => {
      await expect(
        service.createExpo('user-1', {
          name: 'Invalid Dates Expo',
          startAt: '2026-11-25T10:00:00Z',
          endAt: '2026-11-20T10:00:00Z',
          venueName: 'Hall A',
          venueAddress: 'Street 1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if slug already exists', async () => {
      prisma.expo.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createExpo('user-1', {
          name: 'Tech Conf 2026',
          slug: 'tech-conf-2026',
          startAt: '2026-11-20T10:00:00Z',
          endAt: '2026-11-25T10:00:00Z',
          venueName: 'Hall A',
          venueAddress: 'Street 1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if any categoryId is invalid', async () => {
      prisma.expo.findUnique.mockResolvedValue(null);
      prisma.category.count.mockResolvedValue(1);

      await expect(
        service.createExpo('user-1', {
          name: 'Tech Conf 2026',
          startAt: '2026-11-20T10:00:00Z',
          endAt: '2026-11-25T10:00:00Z',
          venueName: 'Hall A',
          venueAddress: 'Street 1',
          categoryIds: ['cat-1', 'cat-invalid'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create expo and atomically assign creator as Admin', async () => {
      prisma.expo.findUnique.mockResolvedValue(null);
      prisma.category.count.mockResolvedValue(1);
      prisma.expo.create.mockResolvedValue(mockExpo);
      prisma.expoMembership.create.mockResolvedValue({
        id: 'mem-1',
        expoId: mockExpo.id,
        userId: 'user-1',
        role: ExpoRole.Admin,
        status: MembershipStatus.Active,
      });

      const result = await service.createExpo('user-1', {
        name: 'Tech Conf 2026',
        startAt: '2026-11-20T10:00:00Z',
        endAt: '2026-11-25T10:00:00Z',
        venueName: 'Expo Center',
        venueAddress: '123 Main St',
        categoryIds: ['cat-1'],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.expo.create).toHaveBeenCalled();
      expect(prisma.expoMembership.create).toHaveBeenCalledWith({
        data: {
          expoId: mockExpo.id,
          userId: 'user-1',
          role: ExpoRole.Admin,
          status: MembershipStatus.Active,
        },
      });
      expect(result.myRole).toEqual(ExpoRole.Admin);
      expect(result.name).toEqual('Tech Conf 2026');
    });
  });

  describe('findAllForUser', () => {
    it('should return all expos where user is an active member', async () => {
      prisma.expoMembership.findMany.mockResolvedValue([
        {
          id: 'mem-1',
          role: ExpoRole.Admin,
          status: MembershipStatus.Active,
          expo: mockExpo,
        },
      ]);

      const result = await service.findAllForUser('user-1');

      expect(prisma.expoMembership.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: MembershipStatus.Active,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockExpo.id);
      expect(result[0].myRole).toBe(ExpoRole.Admin);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if expo does not exist', async () => {
      prisma.expo.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if Draft and user is unauthenticated or not a member', async () => {
      prisma.expo.findFirst.mockResolvedValue(mockExpo); // status is Draft
      prisma.expoMembership.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockExpo.slug, undefined)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne(mockExpo.slug, 'user-stranger')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow access to Draft expo if user is an active member', async () => {
      prisma.expo.findFirst.mockResolvedValue(mockExpo);
      prisma.expoMembership.findUnique.mockResolvedValue({
        role: ExpoRole.Member,
        status: MembershipStatus.Active,
      });

      const result = await service.findOne(mockExpo.id, 'user-member');
      expect(result.id).toBe(mockExpo.id);
      expect(result.myRole).toBe(ExpoRole.Member);
    });

    it('should allow public access to Published expo with myRole as null', async () => {
      const publishedExpo = { ...mockExpo, status: ExpoStatus.Published };
      prisma.expo.findFirst.mockResolvedValue(publishedExpo);

      const result = await service.findOne(publishedExpo.slug, undefined);
      expect(result.id).toBe(publishedExpo.id);
      expect(result.myRole).toBeNull();
    });
  });

  describe('updateExpo', () => {
    it('should throw ForbiddenException if requester is not an active Admin', async () => {
      prisma.expoMembership.findUnique.mockResolvedValue({
        role: ExpoRole.Member,
        status: MembershipStatus.Active,
      });

      await expect(
        service.updateExpo('expo-1', 'user-member', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if expo is not found', async () => {
      prisma.expoMembership.findUnique.mockResolvedValue({
        role: ExpoRole.Admin,
        status: MembershipStatus.Active,
      });
      prisma.expo.findUnique.mockResolvedValue(null);

      await expect(
        service.updateExpo('expo-1', 'user-admin', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update expo when called by an active Admin', async () => {
      prisma.expoMembership.findUnique.mockResolvedValue({
        role: ExpoRole.Admin,
        status: MembershipStatus.Active,
      });
      prisma.expo.findUnique.mockResolvedValue(mockExpo);
      prisma.expo.update.mockResolvedValue({
        ...mockExpo,
        name: 'Updated Name',
      });

      const result = await service.updateExpo('expo-1', 'user-admin', {
        name: 'Updated Name',
      });

      expect(prisma.expo.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
      expect(result.myRole).toBe(ExpoRole.Admin);
    });
  });

  describe('findAllExpos', () => {
    it('should return all public expos (published, ongoing, completed)', async () => {
      prisma.expo.findMany.mockResolvedValue([mockExpo]);

      const result = await service.findAllExpos();

      expect(prisma.expo.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [
              ExpoStatus.Published,
              ExpoStatus.Ongoing,
              ExpoStatus.Completed,
            ],
          },
        },
        include: expect.any(Object),
        orderBy: { startAt: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockExpo.id);
      expect(result[0].myRole).toBeNull();
    });
  });

  describe('deleteExpo', () => {
    it('should throw NotFoundException if expo does not exist', async () => {
      prisma.expo.findUnique.mockResolvedValue(null);

      await expect(service.deleteExpo('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if expo is not in Draft status', async () => {
      prisma.expo.findUnique.mockResolvedValue({
        id: 'expo-1',
        status: ExpoStatus.Published,
      });

      await expect(service.deleteExpo('expo-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete expo when in Draft status', async () => {
      prisma.expo.findUnique.mockResolvedValue({
        id: 'expo-1',
        status: ExpoStatus.Draft,
      });
      prisma.expo.delete.mockResolvedValue({ id: 'expo-1' });

      const result = await service.deleteExpo('expo-1');

      expect(prisma.expo.delete).toHaveBeenCalledWith({
        where: { id: 'expo-1' },
      });
      expect(result).toEqual({
        success: true,
        message: 'Expo deleted successfully',
      });
    });
  });

  describe('getCategories', () => {
    it('should return category list', async () => {
      const categories = [
        { id: 'cat-1', name: 'Technology', slug: 'technology' },
      ];
      prisma.category.findMany.mockResolvedValue(categories);

      const result = await service.getCategories();
      expect(result).toEqual(categories);
    });
  });
});
