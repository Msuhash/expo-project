import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service.js';
import { ExpoRole, MembershipStatus } from '../../generated/prisma/client.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class ExpoAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const expoIdentifier =
      request.params.expoId || request.params.id || request.params.slug;

    if (!expoIdentifier) {
      return true;
    }

    const expo = await this.prisma.expo.findFirst({
      where: {
        OR: [{ id: expoIdentifier }, { slug: expoIdentifier }],
      },
      select: { id: true, slug: true, status: true, createdById: true },
    });

    if (!expo) {
      throw new NotFoundException(`Expo '${expoIdentifier}' not found`);
    }

    const membership = await this.prisma.expoMembership.findUnique({
      where: {
        expoId_userId: {
          expoId: expo.id,
          userId: user.userId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.Active) {
      throw new ForbiddenException(
        'You do not have active membership in this expo workspace',
      );
    }

    const requiredRoles = this.reflector.getAllAndOverride<ExpoRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(membership.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Insufficient permissions. Requires one of: ${requiredRoles.join(', ')}`,
        );
      }
    }

    request.expo = expo;
    request.membership = membership;

    return true;
  }
}

