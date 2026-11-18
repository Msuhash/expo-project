import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service.js';
import { TeamService } from './team.service.js';

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: PrismaService,
          useValue: {
            expo: { findUnique: vi.fn() },
            expoMembership: { findUnique: vi.fn() },
            user: { findUnique: vi.fn() },
            invitation: { findFirst: vi.fn(), create: vi.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
