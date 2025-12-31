/* eslint-disable prettier/prettier */
// src/modules/products/dto/product.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ProductType,
  ProductStatus,
  MeasurementUnit,
} from '../../../common/enums/common.enums';

class NutritionalInfoDto {
  @ApiPropertyOptional({ example: 250 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Hamburguesa Clásica' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Hamburguesa de carne con queso, lechuga y tomate',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  business: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439022' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: ProductType, example: ProductType.SIMPLE })
  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @ApiProperty({ example: 15000, description: 'Precio base en COP' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    enum: MeasurementUnit,
    example: MeasurementUnit.UNIT,
  })
  @IsEnum(MeasurementUnit)
  @IsNotEmpty()
  measurementUnit: MeasurementUnit;

  @ApiPropertyOptional({ example: 1, description: 'Cantidad por unidad' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

 @ApiPropertyOptional({ 
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/delico/products/abc123.jpg',
    description: 'URL de la imagen del producto (subida previamente via /upload/product-image)'
  })
  @IsOptional() // ✅ Cambió de @IsNotEmpty() a @IsOptional()
  @IsString()
  image?: string; // ✅ Cambió de 'image: string' a 'image?: string'

  @ApiPropertyOptional({
    example: ['https://example.com/img1.png', 'https://example.com/img2.png'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCustomizable?: boolean;

  @ApiPropertyOptional({ example: ['Carne', 'Queso', 'Vegetariana'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ type: NutritionalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionalInfoDto)
  nutritionalInfo?: NutritionalInfoDto;

  @ApiPropertyOptional({ example: 50, description: 'Inventario disponible' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Si se debe trackear el inventario',
  })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 4.5, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalReviews?: number;
}

export class UpdateProductStatusDto {
  @ApiProperty({
    enum: ProductStatus,
    example: ProductStatus.AVAILABLE,
  })
  @IsEnum(ProductStatus)
  @IsNotEmpty()
  status: ProductStatus;
}

export class ProductResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ enum: ProductType })
  type: ProductType;

  @ApiProperty()
  basePrice: number;

  @ApiProperty({ enum: MeasurementUnit })
  measurementUnit: MeasurementUnit;

  @ApiPropertyOptional()
  quantity?: number;

  @ApiProperty()
  image: string;

  @ApiPropertyOptional()
  images?: string[];

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty()
  isCustomizable: boolean;

  @ApiPropertyOptional()
  rating?: number;

  @ApiPropertyOptional()
  totalReviews?: number;

  @ApiPropertyOptional()
  tags?: string[];

  @ApiPropertyOptional()
  order?: number;

  @ApiPropertyOptional()
  nutritionalInfo?: NutritionalInfoDto;

  @ApiPropertyOptional()
  stock?: number;

  @ApiPropertyOptional()
  trackInventory?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class IngredientInProductDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isBase: boolean;

  @ApiProperty()
  isRemovable: boolean;

  @ApiProperty()
  isOptional: boolean;

  @ApiProperty()
  additionalPrice: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  image?: string;

  @ApiProperty()
  order?: number;

  @ApiProperty()
  maxQuantity?: number;

  @ApiProperty()
  defaultQuantity?: number;
}

// DTO para promociones en la respuesta
export class PromotionInProductDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  code?: string;

  @ApiProperty()
  minPurchase?: number;

  @ApiProperty()
  maxDiscount?: number;

  @ApiProperty()
  startTime?: string;

  @ApiProperty()
  endTime?: string;

  @ApiProperty()
  daysOfWeek?: string[];
}

// DTO extendido con ingredientes y promociones
export class ProductWithDetailsResponseDto extends ProductResponseDto {
  @ApiPropertyOptional({ type: [IngredientInProductDto] })
  ingredients?: IngredientInProductDto[];

  @ApiPropertyOptional({ type: [PromotionInProductDto] })
  promotions?: PromotionInProductDto[];
}