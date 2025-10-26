// src/modules/promotions/dto/promotion.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  Min,
  Max,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PromotionType,
  PromotionStatus,
} from '../../../common/enums/common.enums';

export class CreatePromotionDto {
  @ApiProperty({ example: 'Descuento de Fin de Semana' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '30% de descuento en hamburguesas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  business: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439022', '507f1f77bcf86cd799439033'],
    description: 'IDs de productos aplicables',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  products: string[];

  @ApiProperty({
    enum: PromotionType,
    example: PromotionType.PERCENTAGE,
  })
  @IsEnum(PromotionType)
  @IsNotEmpty()
  type: PromotionType;

  @ApiProperty({
    example: 30,
    description: 'Valor del descuento (porcentaje o monto fijo)',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2025-01-31T23:59:59Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiPropertyOptional({ example: 'https://example.com/promo.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'WEEKEND30' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Compra mínima requerida en COP',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Descuento máximo en COP (para porcentajes)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Límite de usos (0 = ilimitado)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({
    example: ['friday', 'saturday', 'sunday'],
    description: 'Días de la semana aplicables',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysOfWeek?: string[];

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato debe ser HH:MM (ej: 18:00)',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '23:59' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato debe ser HH:MM (ej: 23:59)',
  })
  endTime?: string;
}

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  @ApiPropertyOptional({
    enum: PromotionStatus,
    example: PromotionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}

export class UpdatePromotionStatusDto {
  @ApiProperty({
    enum: PromotionStatus,
    example: PromotionStatus.ACTIVE,
  })
  @IsEnum(PromotionStatus)
  @IsNotEmpty()
  status: PromotionStatus;
}

export class ApplyPromotionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'WEEKEND30' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 25000, description: 'Precio del producto en COP' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  productPrice: number;
}

export class PromotionResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  products: string[];

  @ApiProperty({ enum: PromotionType })
  type: PromotionType;

  @ApiProperty()
  value: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: PromotionStatus })
  status: PromotionStatus;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  minPurchase?: number;

  @ApiPropertyOptional()
  maxDiscount?: number;

  @ApiPropertyOptional()
  usageLimit?: number;

  @ApiPropertyOptional()
  usageCount?: number;

  @ApiPropertyOptional()
  daysOfWeek?: string[];

  @ApiPropertyOptional()
  startTime?: string;

  @ApiPropertyOptional()
  endTime?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DiscountResultDto {
  @ApiProperty()
  originalPrice: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  promotionApplied: boolean;

  @ApiPropertyOptional()
  promotionName?: string;

  @ApiPropertyOptional()
  promotionId?: string;

  @ApiPropertyOptional()
  message?: string;
}