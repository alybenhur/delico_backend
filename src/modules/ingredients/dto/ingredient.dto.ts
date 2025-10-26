// src/modules/ingredients/dto/ingredient.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IngredientStatus } from '../../../common/enums/common.enums';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Queso Cheddar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Queso cheddar americano fundido' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439022' })
  @IsString()
  @IsNotEmpty()
  business: string;

  @ApiProperty({ example: true, description: 'Ingrediente incluido por defecto' })
  @IsBoolean()
  @IsNotEmpty()
  isBase: boolean;

  @ApiProperty({ example: true, description: 'Se puede quitar del producto' })
  @IsBoolean()
  @IsNotEmpty()
  isRemovable: boolean;

  @ApiProperty({ example: false, description: 'Se puede agregar al producto' })
  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;

  @ApiProperty({ example: 2000, description: 'Precio adicional en COP' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  additionalPrice: number;

  @ApiPropertyOptional({ example: 'https://example.com/ingredient.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Cantidad máxima que se puede agregar (0 = ilimitado)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @ApiPropertyOptional({ example: 1, description: 'Cantidad por defecto' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultQuantity?: number;
}

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {
  @ApiPropertyOptional({
    enum: IngredientStatus,
    example: IngredientStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(IngredientStatus)
  status?: IngredientStatus;
}

export class UpdateIngredientStatusDto {
  @ApiProperty({
    enum: IngredientStatus,
    example: IngredientStatus.AVAILABLE,
  })
  @IsEnum(IngredientStatus)
  @IsNotEmpty()
  status: IngredientStatus;
}

export class IngredientResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  product: string;

  @ApiProperty()
  business: string;

  @ApiProperty()
  isBase: boolean;

  @ApiProperty()
  isRemovable: boolean;

  @ApiProperty()
  isOptional: boolean;

  @ApiProperty()
  additionalPrice: number;

  @ApiProperty({ enum: IngredientStatus })
  status: IngredientStatus;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  order?: number;

  @ApiPropertyOptional()
  maxQuantity?: number;

  @ApiPropertyOptional()
  defaultQuantity?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// DTO para calcular precio de producto customizado
export class CustomizationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({
    example: ['ingredientId1', 'ingredientId2'],
    description: 'IDs de ingredientes a remover',
  })
  @IsOptional()
  @IsString({ each: true })
  removeIngredients?: string[];

  @ApiPropertyOptional({
    example: [
      { ingredientId: 'id1', quantity: 2 },
      { ingredientId: 'id2', quantity: 1 },
    ],
    description: 'Ingredientes a agregar con cantidades',
  })
  @IsOptional()
  addIngredients?: Array<{ ingredientId: string; quantity: number }>;
}

export class PriceCalculationResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  ingredientsAdded: Array<{
    name: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;

  @ApiProperty()
  ingredientsRemoved: string[];

  @ApiProperty()
  additionalCost: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional()
  warnings?: string[];
}