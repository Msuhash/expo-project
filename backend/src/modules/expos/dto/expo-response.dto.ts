import { ExpoRole, ExpoStatus } from '../../../generated/prisma/client.js';

export class ExpoCategoryResponseDto {
  id: string;
  name: string;
  slug: string;
}

export class ExpoCreatorResponseDto {
  id: string;
  username: string;
  displayName: string | null;
}

export class ExpoResponseDto {
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
  createdBy?: ExpoCreatorResponseDto;
  categories: ExpoCategoryResponseDto[];
  myRole?: ExpoRole | null;
}

