import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ExpoStatus } from '../../../generated/prisma/client.js';

export class CreateExpoDto {
  @IsString()
  @IsNotEmpty({ message: 'Expo name is required' })
  @MinLength(3, { message: 'Expo name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Expo name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  @MaxLength(100, { message: 'Slug cannot exceed 100 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with optional single hyphens',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Cover image must be a valid URL' })
  coverImageUrl?: string;

  @IsDateString({}, { message: 'startAt must be a valid ISO-8601 date string' })
  @IsNotEmpty({ message: 'startAt is required' })
  startAt: string;

  @IsDateString({}, { message: 'endAt must be a valid ISO-8601 date string' })
  @IsNotEmpty({ message: 'endAt is required' })
  endAt: string;

  @IsString()
  @IsNotEmpty({ message: 'Venue name is required' })
  @MaxLength(150, { message: 'Venue name cannot exceed 150 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  venueName: string;

  @IsString()
  @IsNotEmpty({ message: 'Venue address is required' })
  @MaxLength(255, { message: 'Venue address cannot exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  venueAddress: string;

  @IsOptional()
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @IsOptional()
  @IsEnum(ExpoStatus, {
    message: 'Status must be one of: Draft, Published, Ongoing, Completed, Cancelled',
  })
  status?: ExpoStatus;

  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'registrationDeadline must be a valid ISO-8601 date string' },
  )
  registrationDeadline?: string;

  @IsOptional()
  @IsArray({ message: 'categoryIds must be an array of category IDs' })
  @IsString({ each: true, message: 'Each categoryId must be a string' })
  categoryIds?: string[];
}

