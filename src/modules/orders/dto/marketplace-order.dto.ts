// src/modules/orders/dto/marketplace-order.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/common.enums';

// Reutilizamos los DTOs existentes
class CoordinatesDto {
  @ApiProperty({ example: 8.7479 })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: -75.8814 })
  @IsNumber()
  @IsNotEmpty()
  lng: number;
}
class DeliveryAddressDto {
  @ApiProperty({ example: 'Calle 50 #30-20' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Montería' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Córdoba' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '230001' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ type: CoordinatesDto })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsNotEmpty()
  coordinates: CoordinatesDto;

  @ApiPropertyOptional({ example: 'Apartamento 301, timbre rojo' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

class CustomizationIngredientDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()  // ✅ Agregado
  @Min(1) 
  quantity: number;
}

class OrderItemCustomizationDto {
  @ApiPropertyOptional({
    example: ['507f1f77bcf86cd799439022'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeIngredients?: string[];

  @ApiPropertyOptional({
    type: [CustomizationIngredientDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationIngredientDto)
  addIngredients?: CustomizationIngredientDto[];
}

// DTO para items del marketplace (incluye el productId que identifica al negocio)
class MarketplaceOrderItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ type: OrderItemCustomizationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderItemCustomizationDto)
  customization?: OrderItemCustomizationDto;

  @ApiPropertyOptional({ example: 'Sin cebolla, extra salsa' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO Principal para crear orden de marketplace
export class CreateMarketplaceOrderDto {
  @ApiProperty({
    type: [MarketplaceOrderItemDto],
    description: 'Items de diferentes negocios',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarketplaceOrderItemDto)
  items: MarketplaceOrderItemDto[];

  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsNotEmpty()
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: { '507f1f77bcf86cd799439011': 'CODIGO20', '507f1f77bcf86cd799439012': 'DESCUENTO10' },
    description: 'Códigos de promoción por negocio (businessId: code)',
  })
  @IsOptional()
  @IsObject()
  promotionCodes?: { [businessId: string]: string };

  @ApiPropertyOptional({ example: 'Entregar antes de las 2pm' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO de respuesta
export class OrderGroupResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  groupNumber: string;

  @ApiProperty()
  client: any;

  @ApiProperty()
  orders: any[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: string;

  @ApiPropertyOptional()
  paymentTransactionId?: string;

  @ApiProperty()
  allDelivered: boolean;

  @ApiProperty()
  hasFailedOrders: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// DTO para cálculo previo (cotización)
export class CalculateMarketplaceOrderDto {
  @ApiProperty({
    type: [MarketplaceOrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarketplaceOrderItemDto)
  items: MarketplaceOrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  promotionCodes?: { [businessId: string]: string };
}

export class MarketplaceCalculationResponseDto {
  @ApiProperty()
  ordersByBusiness: {
    business: any;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    promotionApplied?: any;
    total: number;
  }[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  grandTotal: number;

  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional()
  warnings?: string[];
}