import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for user registration / signup.
 * Strictly adheres to project brief:
 * - Accepts username, email, password, and optional displayName.
 * - Does NOT accept protected fields (id, passwordHash, timestamps, or roles).
 */
export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain alphanumeric characters, underscores, and hyphens',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password cannot exceed 72 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;
}

/**
 * Alias for SignupDto adhering to NestJS CRUD naming conventions.
 */
export class CreateUserDto extends SignupDto {}

/**
 * DTO for user login via email and password.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

/**
 * DTO for profile updates.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Display name cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;
}

/**
 * Safe user response DTO.
 * Explicitly excludes sensitive fields such as passwordHash.
 */
export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

