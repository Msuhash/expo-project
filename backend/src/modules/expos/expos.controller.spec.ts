import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service.js';
import { ExpoRole, ExpoStatus } from '../../generated/prisma/client.js';
import { ExposController } from './expos.controller.js';
import { ExposService } from './expos.service.js';

describe('ExposController', () => {
  let controller: ExposController;
  let service: ExposService;

  const mockExpoResponse = {
    id: 'expo-123',
    createdById: 'user-admin',
    name: 'Tech Expo 2026',
    slug: 'tech-expo-2026',
    description: 'An indoor tech exhibition',
    coverImageUrl: null,
    startAt: new Date('2026-11-20T09:00:00Z'),
    endAt: new Date('2026-11-22T18:00:00Z'),
    venueName: 'Grand Hall',
    venueAddress: '100 Main St',
    capacity: 500,
    status: ExpoStatus.Draft,
    registrationEnabled: false,
    registrationDeadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [],
    myRole: ExpoRole.Admin,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExposController],
      providers: [
        {
          provide: ExposService,
          useValue: {
            createExpo: vi.fn().mockResolvedValue(mockExpoResponse),
            findAllForUser: vi.fn().mockResolvedValue([mockExpoResponse]),
            findAllExpos: vi.fn().mockResolvedValue([mockExpoResponse]),
            findOne: vi.fn().mockResolvedValue(mockExpoResponse),
            updateExpo: vi.fn().mockResolvedValue(mockExpoResponse),
            deleteExpo: vi.fn().mockResolvedValue({
              success: true,
              message: 'Expo deleted successfully',
            }),
            getCategories: vi.fn().mockResolvedValue([
              { id: 'cat-1', name: 'Technology', slug: 'technology' },
            ]),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('test_secret'),
            getOrThrow: vi.fn().mockReturnValue('test_secret'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            expo: {
              findFirst: vi.fn(),
            },
            expoMembership: {
              findUnique: vi.fn(),
            },
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn().mockReturnValue([ExpoRole.Admin]),
          },
        },
      ],
    }).compile();

    controller = module.get<ExposController>(ExposController);
    service = module.get<ExposService>(ExposService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an expo and assign creator as admin', async () => {
      const dto = {
        name: 'Tech Expo 2026',
        startAt: '2026-11-20T09:00:00Z',
        endAt: '2026-11-22T18:00:00Z',
        venueName: 'Grand Hall',
        venueAddress: '100 Main St',
      };
      const result = await controller.create('user-admin', dto);
      expect(service.createExpo).toHaveBeenCalledWith('user-admin', dto);
      expect(result).toEqual(mockExpoResponse);
    });
  });

  describe('findAll', () => {
    it('should list expos where caller is active member', async () => {
      const result = await controller.findAll('user-admin');
      expect(service.findAllForUser).toHaveBeenCalledWith('user-admin');
      expect(result).toEqual([mockExpoResponse]);
    });
  });

  describe('getCategories', () => {
    it('should return reusable categories', async () => {
      const result = await controller.getCategories();
      expect(service.getCategories).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return expo details by id or slug', async () => {
      const result = await controller.findOne('tech-expo-2026', 'user-admin');
      expect(service.findOne).toHaveBeenCalledWith(
        'tech-expo-2026',
        'user-admin',
      );
      expect(result).toEqual(mockExpoResponse);
    });
  });

  describe('findAllExpos', () => {
    it('should list all public expos for explore', async () => {
      const result = await controller.findAllExpos();
      expect(service.findAllExpos).toHaveBeenCalled();
      expect(result).toEqual([mockExpoResponse]);
    });
  });

  describe('update', () => {
    it('should update expo details', async () => {
      const dto = { name: 'Updated Tech Expo' };
      const result = await controller.update('expo-123', 'user-admin', dto);
      expect(service.updateExpo).toHaveBeenCalledWith(
        'expo-123',
        'user-admin',
        dto,
      );
      expect(result).toEqual(mockExpoResponse);
    });
  });

  describe('deleteExpo', () => {
    it('should delete a draft expo', async () => {
      const result = await controller.deleteExpo('expo-123');
      expect(service.deleteExpo).toHaveBeenCalledWith('expo-123');
      expect(result).toEqual({
        success: true,
        message: 'Expo deleted successfully',
      });
    });
  });
});
