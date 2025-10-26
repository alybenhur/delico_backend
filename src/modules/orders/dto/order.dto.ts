// src/modules/orders/dto/order.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CancellationReason,
} from '../../../common/enums/common.enums';

// ==================== DTOs Anidados ====================

class CoordinatesDto {
  @ApiProperty({ example: 8.7479 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -75.8814 })
  @IsNumber()
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
  @IsNumber()
  @Min(1)
  quantity: number;
}

class OrderItemCustomizationDto {
  @ApiPropertyOptional({
    example: ['507f1f77bcf86cd799439022', '507f1f77bcf86cd799439033'],
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

class CreateOrderItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
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

// ==================== DTOs Principales ====================

export class CreateOrderDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  business: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsNotEmpty()
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'BIENVENIDA2025' })
  @IsOptional()
  @IsString()
  promotionCode?: string;

  @ApiPropertyOptional({ example: 'Favor tocar el timbre' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CalculateOrderDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  business: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: 'BIENVENIDA2025' })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Pedido confirmado' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AssignDeliveryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  deliveryId: string;
}

export class CancelOrderDto {
  @ApiProperty({ enum: CancellationReason, example: CancellationReason.CLIENT_REQUEST })
  @IsEnum(CancellationReason)
  @IsNotEmpty()
  reason: CancellationReason;

  @ApiPropertyOptional({ example: 'Ya no lo necesito' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class RateOrderDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  food: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  delivery: number;

  @ApiPropertyOptional({ example: 'Excelente servicio' })
  @IsOptional()
  @IsString()
  comment?: string;
}

// ==================== Response DTOs ====================

export class OrderCalculationResponseDto {
  @ApiProperty()
  business: string;

  @ApiProperty()
  items: any[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  discount: number;

  @ApiPropertyOptional()
  promotionApplied?: {
    id: string;
    name: string;
    discount: number;
  };

  @ApiProperty()
  total: number;

  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional()
  warnings?: string[];
}

export class OrderResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  client: any;

  @ApiProperty()
  business: any;

  @ApiPropertyOptional()
  delivery?: any;

  @ApiProperty()
  items: any[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  statusHistory: any[];

  @ApiProperty()
  estimatedDeliveryTime: number;

  @ApiPropertyOptional()
  estimatedDeliveryDate?: Date;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional()
  currentLocation?: { lat: number; lng: number; timestamp: Date };

  @ApiPropertyOptional()
  distanceRemaining?: number;

  @ApiPropertyOptional()
  timeRemaining?: number;

  @ApiPropertyOptional()
  rating?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}