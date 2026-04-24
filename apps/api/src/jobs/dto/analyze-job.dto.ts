import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeJobDto {
  @ApiProperty({ example: 'My kitchen sink is leaking and there is water under the cabinet' })
  @IsString()
  @IsNotEmpty()
  rawInput: string;

  @ApiPropertyOptional({ example: 48.2082 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 16.3738 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Vienna' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Austria' })
  @IsOptional()
  @IsString()
  country?: string;
}
