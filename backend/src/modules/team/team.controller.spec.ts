import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service.js';
import { ExpoRole } from '../../generated/prisma/enums.js';
import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';

describe('TeamController', () => {
  let controller: TeamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [
        {
          provide: TeamService,
          useValue: {
            createInvitation: vi.fn(),
            acceptInvitation: vi.fn(),
            declineInvitation: vi.fn(),
            revokeInvitation: vi.fn(),
            getInvitationByUser: vi.fn(),
            getInvitationByAdmin: vi.fn(),
            roleManagement: vi.fn(),
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
            expo: { findFirst: vi.fn() },
            expoMembership: { findUnique: vi.fn() },
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

    controller = module.get<TeamController>(TeamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
