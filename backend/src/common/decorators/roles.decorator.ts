import { SetMetadata } from '@nestjs/common';
import { ExpoRole } from '../../generated/prisma/client.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ExpoRole[]) => SetMetadata(ROLES_KEY, roles);

