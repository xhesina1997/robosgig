import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['CLIENT', 'WORKER'] })
  @IsEnum(Role)
  role: 'CLIENT' | 'WORKER';

  @ApiProperty({ example: 'Maria' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Muster' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  // Worker-specific fields
  @ApiPropertyOptional({ example: 48.2082 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 16.3738 })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Mariahilfer Straße 1, 1060 Wien' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Vienna' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  hourlyRate?: number;
}
