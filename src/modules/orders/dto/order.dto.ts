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
  ValidateIf,
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
   @IsEnum(OrderStatus)
  @ApiProperty({
    enum: OrderStatus,
    description: 'Nuevo estado de la orden',
    example: OrderStatus.DELIVERED,
  })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Nota opcional sobre el cambio de estado',
    example: 'Orden entregada en perfectas condiciones',
  })
  note?: string;

  // ✅ NUEVO: Ubicación del delivery al marcar como entregado
  @ValidateIf((o) => o.status === OrderStatus.DELIVERED)
  @IsNumber()
  @ApiProperty({
    description:
      'Latitud del delivery al momento de marcar como entregado (requerido para DELIVERED)',
    example: -7.123456,
    required: false,
  })
  deliveryLatitude?: number;

  @ValidateIf((o) => o.status === OrderStatus.DELIVERED)
  @IsNumber()
  @ApiProperty({
    description:
      'Longitud del delivery al momento de marcar como entregado (requerido para DELIVERED)',
    example: -75.654321,
    required: false,
  })
  deliveryLongitude?: number;
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

// ==================== Response DTOs (ACTUALIZADO) ====================

export class OrderCalculationResponseDto {
  @ApiProperty({ 
    description: 'ID del negocio',
    example: '507f1f77bcf86cd799439011' 
  })
  business: string;

  @ApiProperty({ 
    description: 'Items de la orden con precios calculados',
    type: 'array',
    example: [{
      product: '507f1f77bcf86cd799439011',
      productName: 'Pizza napolitana',
      productPrice: 17600,        // ✅ Precio CON descuento
      originalPrice: 22000,       // ✅ NUEVO: Precio original
      promotionId: '507f...',     // ✅ NUEVO: ID de promoción aplicada
      discountAmount: 4400,       // ✅ NUEVO: Descuento unitario
      totalSavings: 4400,         // ✅ NUEVO: Ahorro total del item
      quantity: 1,
      subtotal: 17600,
      customizationCost: 0,
      itemTotal: 17600
    }]
  })
  items: any[];

  @ApiProperty({ 
    description: 'Subtotal de la orden (ya incluye descuentos de productos)',
    example: 17600 
  })
  subtotal: number;

  @ApiProperty({ 
    description: 'Total ahorrado en promociones de productos',
    example: 4400 
  })
  totalPromotionSavings: number;  // ✅ NUEVO

  @ApiProperty({ 
    description: 'Costo de envío',
    example: 5000 
  })
  deliveryFee: number;

  @ApiProperty({ 
    description: 'Descuento adicional por código promocional',
    example: 0 
  })
  discount: number;

  @ApiPropertyOptional({
    description: 'Información de promoción por código aplicada',
    example: {
      id: '507f1f77bcf86cd799439011',
      name: 'DESCUENTO10',
      discount: 1000
    }
  })
  promotionApplied?: {
    id: string;
    name: string;
    discount: number;
  };

  @ApiProperty({ 
    description: 'Total final a pagar',
    example: 22600 
  })
  total: number;

  @ApiProperty({ 
    description: 'Indica si el cálculo es válido',
    example: true 
  })
  isValid: boolean;

  @ApiPropertyOptional({
    description: 'Advertencias o errores no críticos',
    type: [String],
    example: ['Algunos productos no disponibles']
  })
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

