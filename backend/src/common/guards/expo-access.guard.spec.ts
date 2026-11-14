import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExpoRole, MembershipStatus } from '../../generated/prisma/client.js';
import { ExpoAccessGuard } from './expo-access.guard.js';

describe('ExpoAccessGuard', () => {
  let guard: ExpoAccessGuard;
  let reflector: Reflector;
  let prisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      expo: {
        findFirst: vi.fn(),
      },
      expoMembership: {
        findUnique: vi.fn(),
      },
    };
    guard = new ExpoAccessGuard(reflector, prisma);
  });

  const createMockContext = (
    req: {
      user?: any;
      params?: any;
      expo?: any;
      membership?: any;
    } = {},
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as any;

  it('should throw UnauthorizedException if request has no user', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return true if no expo identifier in params', async () => {
    const context = createMockContext({
      user: { userId: 'user-1' },
      params: {},
    });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw NotFoundException if target expo does not exist', async () => {
    prisma.expo.findFirst.mockResolvedValue(null);
    const context = createMockContext({
      user: { userId: 'user-1' },
      params: { id: 'nonexistent-expo' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if user has no active membership', async () => {
    prisma.expo.findFirst.mockResolvedValue({ id: 'expo-1' });
    prisma.expoMembership.findUnique.mockResolvedValue(null);

    const context = createMockContext({
      user: { userId: 'user-1' },
      params: { id: 'expo-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException if user role is insufficient', async () => {
    prisma.expo.findFirst.mockResolvedValue({ id: 'expo-1' });
    prisma.expoMembership.findUnique.mockResolvedValue({
      role: ExpoRole.Member,
      status: MembershipStatus.Active,
    });
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ExpoRole.Admin]);

    const context = createMockContext({
      user: { userId: 'user-1' },
      params: { id: 'expo-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should attach expo and membership and return true if authorized', async () => {
    const mockExpo = { id: 'expo-1' };
    const mockMembership = {
      role: ExpoRole.Admin,
      status: MembershipStatus.Active,
    };
    prisma.expo.findFirst.mockResolvedValue(mockExpo);
    prisma.expoMembership.findUnique.mockResolvedValue(mockMembership);
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ExpoRole.Admin]);

    const req: any = {
      user: { userId: 'user-1' },
      params: { id: 'expo-1' },
    };
    const context = createMockContext(req);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req.expo).toEqual(mockExpo);
    expect(req.membership).toEqual(mockMembership);
  });
});

